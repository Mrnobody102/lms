FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=super-portal...

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/apps/super-portal/next.config.js .
COPY --from=builder /app/apps/super-portal/package.json .
COPY --from=builder --chown=nextjs:nodejs /app/apps/super-portal/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/super-portal/.next/static ./apps/super-portal/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/super-portal/public ./apps/super-portal/public

CMD ["node", "apps/super-portal/server.js"]
