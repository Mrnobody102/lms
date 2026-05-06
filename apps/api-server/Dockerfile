# syntax=docker/dockerfile:1.7
FROM node:20.19.5-alpine3.22 AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm config set store-dir /pnpm/store

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api-server/package.json ./apps/api-server/package.json
COPY apps/web-admin/package.json ./apps/web-admin/package.json
COPY apps/web-student/package.json ./apps/web-student/package.json
COPY apps/super-portal/package.json ./apps/super-portal/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/ts-config/package.json ./packages/ts-config/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile
COPY apps/api-server ./apps/api-server
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY packages/ts-config ./packages/ts-config
RUN pnpm turbo build --filter=api-server...

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=builder /app/apps/api-server/package.json ./apps/api-server/package.json
COPY --from=builder /app/apps/api-server/dist ./apps/api-server/dist
COPY --from=builder /app/apps/api-server/node_modules ./apps/api-server/node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/package.json ./package.json

CMD ["node", "apps/api-server/dist/main.js"]
