# 🛠 Troubleshooting Guide

This guide provides solutions for common issues encountered during setup and development of the LMS platform.

---

## 📑 Table of Contents

1. [Environment Setup](#-environment-setup)
   - [Docker & Database](#docker--database-issues)
   - [Local PostgreSQL Alternative](#alternative-solution-use-local-postgresql)
2. [Development & Coding](#-development--coding)
   - [Port & Process Management](#1-port--process-issues-eaddrinuse)
   - [Multi-language (i18n) Pitfalls](#2-multi-language-i18n-pitfalls)
   - [Monorepo & Turbo Management](#3-monorepo--turbo-management)
   - [UI & Tailwind Issues](#4-ui--tailwind-issues)
3. [General Workflow Tips](#-general-workflow-tips)

---

## 🔧 Environment Setup

### Docker & Database Issues

#### Error: Docker Desktop is unable to start

If you see `Error response from daemon: Docker Desktop is unable to start`, try the following:

- **Enable WSL2 (Most Common)**: Run as Administrator:
  ```powershell
  wsl --install
  wsl --set-default-version 2
  wsl --update
  ```
- **Enable Hyper-V**: Run PowerShell as Administrator:
  ```powershell
  Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
  ```
- **BIOS Settings**: Ensure Virtualization (Intel VT-x or AMD-V) is enabled in your BIOS.
- **Factory Reset**: Right-click Docker tray icon > Troubleshoot > Reset to factory defaults.

#### Alternative: Use Local PostgreSQL

If Docker continues to fail, install PostgreSQL 15/16 directly on your machine.

1. **Install PostgreSQL for Windows**: [Download here](https://www.postgresql.org/download/windows/)
2. **Update `.env` file**:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/lms_platform?schema=public"
   ```
3. **Database Setup**:
   ```sql
   CREATE DATABASE lms_platform;
   ```

### Step-by-Step Setup Checklist

Once the database is running:

- [ ] **Verify Connection**: `Test-NetConnection -ComputerName localhost -Port 5432`
- [ ] **Run Migrations**: `pnpm db:migrate`
- [ ] **Seed Data**: Use Prisma Studio (`pnpm --filter @repo/database db:studio`) to add a test tenant if necessary.
- [ ] **Start API**: `pnpm dev` (should run on `http://localhost:4000/api`)

---

## 🚀 Development & Coding

### 1. Port & Process Issues (`EADDRINUSE`)

**Scenario**: `Error: listen EADDRINUSE: address already in use :::3002`.

- **Check PID**: `netstat -ano | findstr :3002`
- **Kill Process**: `taskkill /F /PID <PID>`
- **Kill All Node/Next.js**:
  ```powershell
  Get-Process -Name node | Where-Object { $_.Path -like "*next*" } | Stop-Process -Force
  ```

### 2. Multi-language (i18n) Pitfalls

**Scenario**: `[next-intl] Could not locate request configuration module`.

- **Structure Check**: `next-intl` expects config at `src/i18n/request.ts` (or `/i18n/request.ts` if no `src`).
- **Pathing**: Ensure dynamic imports in `request.ts` correctly point to `messages/*.json`.
  ```typescript
  messages: (await import(`../messages/${locale}.json`)).default;
  ```

### 3. Monorepo & Turbo Management

**Scenario**: Changes in `@repo/ui` aren't reflecting, or builds are inconsistent.

1. **Clean Cache**: `npx turbo clean`
2. **Re-install**: `pnpm install`
3. **Targeted Run**: `pnpm --filter <app-name> dev`

### 4. UI & Tailwind Issues

- **HSL Format**: Variables must be raw numbers for opacity support.
  - ✅ `--primary: 222 47% 11%;`
  - ❌ `--primary: hsl(222, 47%, 11%);`
- **Config**: Use `<alpha-value>` in `tailwind.config.ts`:
  ```typescript
  primary: "hsl(var(--primary) / <alpha-value>)";
  ```

---

## 💡 General Workflow Tips

1. **Use `--filter`**: Keep `pnpm-lock.yaml` clean by targeting specific apps:
   ```bash
   pnpm add next-intl --filter web-admin
   ```
2. **Verification Check**: Always check `git status` after complex refactors.
3. **Conventional Commits**: Use `feat(scope): message` for better history.

---

_Last updated: March 16, 2026_
