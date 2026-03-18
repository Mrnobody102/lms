# Deployment and DevOps

**Tier:** POWERFUL  
**Category:** Engineering / DevOps  
**Maintainer:** LMS Agent Team

---

## Overview

Procedures for containerization, CI/CD, and deploying the LMS platform to various environments.

## Core Capabilities

- **dockerization**: Creating multi-stage Docker builds for NestJS and Next.js.
- **cicd_pipelines**: Automating builds and tests via GitHub Actions or similar.
- **env_management**: Managing secrets and environment-specific configurations.

## Docker Strategy

- Use `node:20-alpine` as the base image for reduced size.
- Utilize Turbo's "prune" feature for efficient monorepo builds.
- Configure `output: 'standalone'` in Next.js for efficient production serving.

## Environment Variables

- `.env`: Local development.
- `.env.production`: Production secrets.
- Always include `NEXT_PUBLIC_API_URL` and `DATABASE_URL`.

## Infrastructure

- Database: Managed PostgreSQL (e.g., Supabase, RDS).
- Hosting: Vercel (Frontend), AWS ECS or similar (Backend).
