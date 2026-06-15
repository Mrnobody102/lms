# IBM System x3650 M3 Production Deploy Runbook

Tài liệu này dành riêng cho phương án tự host LMS Platform trên server IBM System x3650 M3 như hình chụp. Kết luận ngắn: máy này dùng được cho staging, demo, pilot hoặc production nhỏ nếu phần cứng còn tốt và có SSD/RAID/backup nghiêm túc. Không nên xem đây là production HA vì toàn bộ stack vẫn nằm trên một máy vật lý.

Nguồn phần cứng đã đối chiếu ngày 2026-06-10:

- Lenovo Press, [IBM System x3650 M3 Product Guide](https://lenovopress.lenovo.com/tips0805-system-x3650-m3), ghi rõ đây là sản phẩm đã withdrawn; cấu hình tối đa 2 CPU Xeon 5600, 18 DIMM DDR3 ECC tới 288 GB, 16 bay 2.5 inch SAS/SATA/SSD, RAID 0/1/5/10/50 tùy controller, nguồn/quạt/ổ hot-swap.
- Docker Docs, [Install Docker Engine on Debian](https://docs.docker.com/engine/install/debian/), Docker Engine hỗ trợ Debian 11/12/13 trên amd64.
- Caddy Docs, [Automatic HTTPS](https://caddyserver.com/docs/automatic-https), Caddy tự cấp và gia hạn certificate khi domain public trỏ đúng về server.

## Quyết định dùng hay không

Nên dùng khi:

- Lớp người dùng ban đầu nhỏ, có thể chấp nhận downtime bảo trì.
- Mục tiêu là self-host tiết kiệm chi phí, demo khách hàng, staging thật hoặc production pilot.
- Máy có tối thiểu 2 PSU, quạt ổn, RAM ECC không lỗi, RAID controller hoạt động, disk health sạch.
- Có backup PostgreSQL ra ngoài máy này và đã thử restore.

Không nên dùng làm production chính khi:

- Cần SLA cao, nhiều tenant trả phí, hoặc không chấp nhận mất dịch vụ khi hỏng mainboard/RAID/power/network.
- Chưa có SSD RAID1/10, chưa có UPS, chưa có backup off-host.
- Chưa test tải thật bằng dữ liệu gần production.
- Muốn phục vụ traffic lớn hoặc nhiều upload/video/audio trực tiếp từ server.

Khuyến nghị thực tế:

- Tốt nhất: dùng x3650 M3 làm app host chạy Docker, còn PostgreSQL/Redis/object storage dùng managed service.
- Nếu all-in-one: chỉ dùng cho early production nhỏ, bắt buộc có RAID, UPS, backup ngoài máy, monitoring và quy trình restore.

## Cấu hình phần cứng tối thiểu

Không thể biết cấu hình thật chỉ từ ảnh. Trước khi deploy, boot Linux live hoặc OS hiện tại rồi ghi nhận:

```bash
lscpu
free -h
lsblk -o NAME,SIZE,MODEL,ROTA,TYPE,MOUNTPOINT
ip addr
sudo dmidecode -t system -t processor -t memory
sudo smartctl --scan
sudo ipmitool sdr elist
sudo ipmitool sel list
```

Ngưỡng nên đạt:

| Hạng mục       | Tối thiểu chạy được       | Khuyến nghị production nhỏ          |
| -------------- | ------------------------- | ----------------------------------- |
| CPU            | 1 CPU Xeon 5600, 4-6 core | 2 CPU Xeon 5600, tổng 8-12 core     |
| RAM            | 32 GB ECC                 | 64-128 GB ECC                       |
| Disk OS/Docker | SSD RAID1                 | SSD RAID10 nếu DB self-host         |
| DB storage     | Không dùng HDD đơn        | SSD enterprise, RAID1/10, còn spare |
| Network        | 1 Gbps                    | 1 Gbps ổn định, IP tĩnh             |
| Power          | 1 PSU                     | 2 PSU + UPS                         |
| Backup         | Manual dump               | Daily off-host + restore drill      |

Với stack hiện tại, Docker Compose sẽ chạy Caddy, API NestJS, 4 app Next.js, PostgreSQL, Redis, Prometheus và Alertmanager. RAM dưới 32 GB vẫn có thể chạy nhưng dễ nghẽn khi build image, chạy DB và Next.js cùng lúc.

## Kiến trúc production đúng chuẩn

Production mặc định dùng topology Docker đã có trong repo:

- Public internet chỉ mở `80/tcp` và `443/tcp` vào Caddy.
- Caddy tự xử lý HTTPS, route host về đúng container, và strip `x-tenant-id`.
- API, Next.js, PostgreSQL, Redis, Prometheus, Alertmanager chỉ nằm trong Docker network nội bộ.
- Migration chạy bằng Prisma `migrate deploy`, không dùng `db:push`.
- `.env.production` không commit vào git.

Domain mẫu:

```text
api.example.com      -> API
student.example.com  -> web-student
admin.example.com    -> web-admin
portal.example.com   -> super-portal
courses.example.com  -> web-sales
```

DNS của 5 subdomain phải trỏ A record về public IP của server. Nếu server nằm sau router/NAT, forward `80` và `443` tới IP nội bộ của server.

## Chuẩn bị OS

Khuyến nghị Debian 12 minimal amd64 cho phần cứng cũ. Ubuntu Server 24.04 LTS cũng được nếu RAID/network driver nhận ổn.

Cài package nền:

```bash
sudo apt update
sudo apt full-upgrade -y
sudo apt install -y ca-certificates curl gnupg git ufw fail2ban smartmontools ipmitool dmidecode htop ncdu sysstat
sudo timedatectl set-timezone Asia/Ho_Chi_Minh
sudo hostnamectl set-hostname lms-prod-01
```

Cài Docker Engine từ repository chính thức của Docker trên Debian:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run --rm hello-world
```

Nếu user deploy không phải root:

```bash
sudo usermod -aG docker "$USER"
newgrp docker
```

Firewall:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Không mở public các port `3000`, `4000`, `5432`, `6379`, `9090`, `9093`.

## Chuẩn bị source và env

```bash
sudo mkdir -p /opt/lms
sudo chown "$USER:$USER" /opt/lms
git clone <repo-url> /opt/lms/current
cd /opt/lms/current
cp .env.production.example .env.production
chmod 600 .env.production
```

Sửa `.env.production` bằng secret thật:

```bash
DEPLOYMENT_TOPOLOGY=docker
API_HOST=api.example.com
STUDENT_HOST=student.example.com
ADMIN_HOST=admin.example.com
PORTAL_HOST=portal.example.com
COURSES_HOST=courses.example.com
CADDY_ACME_EMAIL=ops@example.com

APP_PUBLIC_URL=https://api.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_WEB_STUDENT_URL=https://student.example.com
NEXT_PUBLIC_WEB_SALES_URL=https://courses.example.com
CORS_ORIGINS=https://student.example.com,https://admin.example.com,https://portal.example.com,https://courses.example.com

POSTGRES_PASSWORD=<random-32-plus-chars>
DATABASE_URL=postgresql://postgres:<same-password>@postgres:5432/lms_platform
REDIS_URL=redis://redis:6379
JWT_SECRET=<random-32-plus-chars>
JWT_RESET_SECRET=<random-32-plus-chars>
AUTH_COOKIE_DOMAIN=.example.com
AUTH_COOKIE_SAME_SITE=lax
TRUST_PROXY=true
ALLOW_TENANT_HEADER_IN_PRODUCTION=false

ALERTMANAGER_WEBHOOK_URL=<real-alert-webhook>
```

Tạo secret:

```bash
openssl rand -base64 48
```

Kiểm tra env và compose trước khi chạy:

```bash
docker compose --env-file .env.production -f deployment/production/docker-compose.prod.yml config --quiet
```

Nếu máy deploy có Node.js 20 và pnpm 9, chạy thêm preflight của repo:

```bash
corepack enable
corepack prepare pnpm@9.0.0 --activate
pnpm install --frozen-lockfile
pnpm run check:production-env -- --file .env.production
```

## Deploy lần đầu

Từ `/opt/lms/current`:

```bash
docker compose --env-file .env.production -f deployment/production/docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f deployment/production/docker-compose.prod.yml ps
docker compose --env-file .env.production -f deployment/production/docker-compose.prod.yml logs -f api caddy
```

Kiểm tra public:

```bash
curl -fsS https://api.example.com/api/health/live
curl -fsS https://api.example.com/api/health/ready
curl -I https://student.example.com
curl -I https://admin.example.com
curl -I https://portal.example.com
curl -I https://courses.example.com
```

Smoke từ máy operator có PowerShell:

```bash
pnpm smoke:deploy -- -ApiUrl https://api.example.com -WebStudentUrl https://student.example.com -WebAdminUrl https://admin.example.com -SuperPortalUrl https://portal.example.com
```

Smoke auth bằng tài khoản test thật:

```bash
AUTH_SMOKE_WEB_URL=https://student.example.com \
AUTH_SMOKE_API_URL=https://api.example.com \
AUTH_SMOKE_TENANT_ID=<tenant-id-or-slug> \
AUTH_SMOKE_EMAIL=<student-test-email> \
AUTH_SMOKE_PASSWORD='<student-test-password>' \
pnpm run smoke:auth-production
```

## Redeploy release mới

Luồng chuẩn:

```bash
cd /opt/lms/current
git fetch --all --tags
git checkout <release-tag-or-commit>
docker compose --env-file .env.production -f deployment/production/docker-compose.prod.yml config --quiet
docker compose --env-file .env.production -f deployment/production/docker-compose.prod.yml up -d postgres redis
docker compose --env-file .env.production -f deployment/production/docker-compose.prod.yml up --build --force-recreate migrate
docker compose --env-file .env.production -f deployment/production/docker-compose.prod.yml up -d --build --force-recreate api web-student web-sales web-admin super-portal caddy prometheus alertmanager
docker compose --env-file .env.production -f deployment/production/docker-compose.prod.yml ps
```

Sau deploy:

```bash
curl -fsS https://api.example.com/api/health/ready
pnpm smoke:deploy -- -ApiUrl https://api.example.com -WebStudentUrl https://student.example.com -WebAdminUrl https://admin.example.com -SuperPortalUrl https://portal.example.com
```

Chỉ prune image sau khi đã smoke pass:

```bash
docker image prune -f
```

## Backup và restore

Nếu self-host PostgreSQL trong compose, backup phải ghi ra ngoài server:

```bash
mkdir -p /opt/lms/backups
docker compose --env-file .env.production -f deployment/production/docker-compose.prod.yml exec -T postgres \
  pg_dump -U postgres -d lms_platform --format=custom --no-owner --no-acl \
  > "/opt/lms/backups/lms-$(date +%Y%m%d%H%M%S).dump"
```

Sau đó đồng bộ backup sang máy khác hoặc object storage:

```bash
rsync -av /opt/lms/backups/ backup-user@backup-host:/srv/backups/lms/
```

Restore drill phải làm ở staging theo [backup-restore-runbook.md](../runbooks/backup-restore-runbook.md). Production chỉ restore khi đã dừng traffic public và có quyết định rollback rõ ràng.

## Monitoring vận hành

Health endpoints:

```bash
curl -fsS https://api.example.com/api/health/ready
curl -fsS https://api.example.com/api/health/metrics/prometheus
```

Log nhanh:

```bash
docker compose --env-file .env.production -f deployment/production/docker-compose.prod.yml logs --tail=200 api
docker compose --env-file .env.production -f deployment/production/docker-compose.prod.yml logs --tail=200 caddy
docker compose --env-file .env.production -f deployment/production/docker-compose.prod.yml logs --tail=200 postgres
```

Tài nguyên host:

```bash
docker stats
df -h
free -h
iostat -xz 1
sudo smartctl -a /dev/sdX
sudo ipmitool sdr elist
```

Không expose Prometheus/Alertmanager ra internet. Dùng SSH tunnel hoặc VPN khi cần xem nội bộ.

## Rủi ro riêng của x3650 M3

- Đây là hardware đời cũ, official product guide đã đánh dấu withdrawn. Linh kiện, firmware và support OEM không nên xem là đảm bảo.
- CPU Xeon 5500/5600 đủ chạy Node.js/Docker nhưng yếu hơn server/cloud mới, đặc biệt khi build image, render SSR, report nặng hoặc nhiều request auth đồng thời.
- RAID controller/cache/BBU cũ có thể là điểm hỏng nghiêm trọng. Luôn kiểm tra event log controller và tình trạng pin/cache.
- HDD SAS/SATA cũ rất dễ thành bottleneck cho PostgreSQL. Dùng SSD enterprise nếu DB self-host.
- IMM đời cũ có thể dùng TLS/cipher cũ; đặt network quản trị riêng, không expose IMM ra internet.
- Máy 2U này ồn và tốn điện. Cần rack/thoáng khí/UPS, không đặt ở nơi mất điện hoặc nóng.

## Tiêu chí được phép nhận traffic production

Chỉ mở production khi các mục này đều đạt:

- `docker compose ... config --quiet` pass với `.env.production` thật.
- `pnpm run check:production-env -- --file .env.production` pass hoặc đã chạy tương đương từ CI/operator machine.
- Caddy cấp HTTPS thành công cho đủ 5 domain.
- `/api/health/ready` trả ok.
- Smoke deploy và smoke auth pass.
- Backup PostgreSQL đã chạy thử và file backup nằm ngoài server.
- Đã restore drill ở staging ít nhất một lần.
- Public scan không thấy port app/database/cache/monitoring.
- Alert webhook nhận được test alert.
- Có người chịu trách nhiệm nhận alert và quy trình rollback theo runbook.
