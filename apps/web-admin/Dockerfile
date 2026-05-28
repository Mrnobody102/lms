# syntax=docker/dockerfile:1.7
FROM node:20.19.5-alpine3.22 AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm config set store-dir /pnpm/store

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEB_STUDENT_URL
ARG NEXT_PUBLIC_TENANT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WEB_STUDENT_URL=$NEXT_PUBLIC_WEB_STUDENT_URL
ENV NEXT_PUBLIC_TENANT_ID=$NEXT_PUBLIC_TENANT_ID
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api-server/package.json ./apps/api-server/package.json
COPY apps/web-admin/package.json ./apps/web-admin/package.json
COPY apps/web-student/package.json ./apps/web-student/package.json
COPY apps/web-sales/package.json ./apps/web-sales/package.json
COPY apps/super-portal/package.json ./apps/super-portal/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/ts-config/package.json ./packages/ts-config/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile
COPY apps/web-admin ./apps/web-admin
COPY packages/api-client ./packages/api-client
COPY packages/shared ./packages/shared
COPY packages/ts-config ./packages/ts-config
COPY packages/ui ./packages/ui
RUN pnpm turbo build --filter=web-admin...

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/apps/web-admin/next.config.js .
COPY --from=builder /app/apps/web-admin/package.json .
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-admin/.next/static ./apps/web-admin/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-admin/public ./apps/web-admin/public

CMD ["node", "apps/web-admin/server.js"]
