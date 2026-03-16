# Project Structure

```
lms/
├── apps/
│   ├── api-server/          # NestJS API Server
│   ├── web-student/         # Student Portal
│   ├── web-admin/           # Admin Portal
│   └── super-portal/        # Super Admin Portal
│
├── packages/
│   ├── database/            # Prisma schema & migrations
│   ├── shared/              # Shared utilities
│   ├── ui/                  # Shared UI components
│   └── typescript-config/   # Shared TS configs
│
├── docs/                    # 📚 Documentation
│   ├── API_DOCUMENTATION.md
│   ├── QUICK_START.md
│   └── TROUBLESHOOTING.md
│
├── scripts/                 # 🛠️ Setup & utility scripts
│   ├── test-api.ps1         # PowerShell API testing
│   └── create-tenant.sql    # Create test tenant
│
├── tests/                   # 🧪 API test collections
│   ├── api-tests.http       # REST Client collection
│   └── test-register.json   # Test data
│
├── .env                     # Environment variables
├── docker-compose.yml       # Docker services
├── package.json             # Monorepo root
└── turbo.json              # Turborepo config
```

## Quick Links

### Documentation

- [API Documentation](./docs/API_DOCUMENTATION.md) - Complete API reference
- [Quick Start Guide](./docs/QUICK_START.md) - Setup instructions
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues

### Testing

- [API Tests](./tests/api-tests.http) - REST Client collection
- [Test Script](./scripts/test-api.ps1) - PowerShell testing

### Development

```bash
# Start all services
pnpm dev

# Start API server only
cd apps/api-server && pnpm dev

# Database
pnpm db:up        # Start PostgreSQL
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Prisma Studio
```

## API Server Structure

```
apps/api-server/src/
├── auth/                    # Authentication module
│   ├── decorators/         # @CurrentUser(), @Roles()
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   ├── strategies/         # JWT strategy
│   └── dto/                # Login, Register DTOs
│
├── user/                    # User profile module
│   ├── user.controller.ts  # Profile endpoints
│   ├── user.service.ts     # Profile logic
│   └── dto/                # Update, ChangePassword DTOs
│
├── admin/                   # Admin user management
│   ├── admin.controller.ts # Admin endpoints
│   ├── admin.service.ts    # Admin logic
│   └── dto/                # Query, Status DTOs
│
└── common/                  # Shared resources
    ├── services/           # PrismaService
    ├── filters/            # Exception filters
    ├── interceptors/       # Response interceptors
    └── dto/                # Base response DTOs
```
