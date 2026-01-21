# 🔧 Environment Setup Troubleshooting Guide

## ⚠️ Current Status

**Docker Desktop:** ❌ Unable to start  
**PostgreSQL Database:** ❌ Not running (port 5432 closed)  
**API Server:** ❌ Not started

---

## 🐛 Docker Desktop Issue

### Error Detected:

```
Error response from daemon: Docker Desktop is unable to start
```

### Common Causes & Solutions:

#### Solution 1: Enable WSL2 (Most Common)

```powershell
# Run as Administrator
wsl --install
wsl --set-default-version 2
wsl --update
```

Then restart Docker Desktop.

#### Solution 2: Enable Hyper-V

```powershell
# Run PowerShell as Administrator
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
```

Restart computer after enabling.

#### Solution 3: Check Virtualization in BIOS

1. Restart computer
2. Enter BIOS (usually F2, F10, or Del key)
3. Enable Intel VT-x or AMD-V
4. Save and restart

#### Solution 4: Reset Docker Desktop

1. Right-click Docker Desktop in system tray
2. Select "Troubleshoot"
3. Click "Reset to factory defaults"
4. Restart Docker Desktop

#### Solution 5: Reinstall Docker Desktop

1. Uninstall Docker Desktop completely
2. Download latest version from docker.com
3. Install with WSL2 backend option checked

---

## 🚀 Alternative Solution: Use Local PostgreSQL

If Docker continues to fail, install PostgreSQL directly:

### Option A: Install PostgreSQL for Windows

1. **Download PostgreSQL:**
   - Visit: https://www.postgresql.org/download/windows/
   - Download installer (version 15 or 16)

2. **Install:**

   ```
   - Port: 5432
   - Password: postgres (or your choice)
   - Keep other defaults
   ```

3. **Update .env file:**

   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/lms_platform?schema=public"
   ```

4. **Create Database:**
   ```sql
   CREATE DATABASE lms_platform;
   ```

### Option B: Use PostgreSQL in WSL2

```bash
# In WSL2 terminal
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start

# Create user and database
sudo -u postgres psql
CREATE DATABASE lms_platform;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE lms_platform TO postgres;
\q
```

Update DATABASE_URL to use WSL2 IP:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms_platform?schema=public"
```

---

## 📋 Step-by-Step Setup (Once Docker/PostgreSQL is Working)

### Step 1: Verify Database is Running

```powershell
# Test connection
Test-NetConnection -ComputerName localhost -Port 5432

# Should return: TcpTestSucceeded : True
```

### Step 2: Run Database Migration

```bash
cd c:\Users\ADMIN\Desktop\Other_Project\myproject\lms
pnpm db:migrate
```

When prompted, enter: `add_user_profile_fields`

### Step 3: Create Test Tenant

```bash
# Open Prisma Studio
pnpm --filter @repo/database db:studio
```

In Prisma Studio:

1. Go to "Tenant" model
2. Click "Add record"
3. Fill in:
   - id: `test-tenant-123`
   - name: `Test Learning Center`
   - slug: `test-center`
   - settings: `{}`
4. Save

### Step 4: Start API Server

```bash
# From project root
pnpm dev
```

Wait for:

```
🚀 Application is running on: http://localhost:4000/api
```

### Step 5: Create Test Users

#### Create Regular User:

```bash
curl -X POST http://localhost:4000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"Test1234\",\"fullName\":\"Test User\",\"phoneNumber\":\"+84901234567\",\"tenantId\":\"test-tenant-123\"}"
```

#### Create Admin User:

```bash
curl -X POST http://localhost:4000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"Admin1234\",\"fullName\":\"Admin User\",\"phoneNumber\":\"+84901234568\",\"tenantId\":\"test-tenant-123\"}"
```

Then update role in database:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

### Step 6: Verify Setup

```bash
# Test API is responding
curl http://localhost:4000/api

# Test login
curl -X POST http://localhost:4000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"Test1234\"}"
```

---

## ✅ Verification Checklist

Before running tests, verify:

- [ ] Docker Desktop is running (or PostgreSQL installed locally)
- [ ] Database is accessible on port 5432
- [ ] Database migration completed successfully
- [ ] Test tenant created
- [ ] Test users created (regular user + admin user)
- [ ] API server running on port 4000
- [ ] `/api/auth/login` returns JWT token

---

## 🧪 Quick Test After Setup

```bash
# 1. Login
curl -X POST http://localhost:4000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"Test1234\"}"

# Save the token from response

# 2. Get profile (replace YOUR_TOKEN)
curl -X GET http://localhost:4000/api/users/me ^
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Update profile
curl -X PUT http://localhost:4000/api/users/me ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\":\"Updated Name\"}"
```

If all three commands work → Environment is ready for full testing!

---

## 🆘 Still Having Issues?

### Check Logs:

#### API Server Logs:

```bash
# Check running pnpm dev terminal for errors
```

#### Database Connection:

```bash
# Try connecting with psql
psql -h localhost -p 5432 -U postgres -d lms_platform
```

#### Common Errors:

**Error: Cannot find module '@nestjs/config'**

```bash
cd apps/api-server
pnpm install
```

**Error: P1001: Can't reach database**

- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Check firewall settings

**Error: P3009: Migration failed**

- Drop and recreate database
- Run migration again

---

## 📞 Next Steps

1. Fix Docker Desktop issues using solutions above
2. OR install PostgreSQL locally
3. Complete setup steps
4. Run verification checklist
5. Notify me when ready for testing

Once environment is ready, I will execute the full test suite!
