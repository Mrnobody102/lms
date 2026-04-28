FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

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
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm turbo build --filter=web-student...

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/apps/web-student/next.config.js .
COPY --from=builder /app/apps/web-student/package.json .
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-student/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-student/.next/static ./apps/web-student/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-student/public ./apps/web-student/public

CMD ["node", "apps/web-student/server.js"]
