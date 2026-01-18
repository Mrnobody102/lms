FROM node:18-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scan-imports super-portal --docker

FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN npm install -g pnpm
RUN pnpm install

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN pnpm turbo build --filter=super-portal...

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/super-portal/next.config.js .
COPY --from=installer /app/apps/super-portal/package.json .
COPY --from=installer --chown=nextjs:nodejs /app/apps/super-portal/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/super-portal/.next/static ./apps/super-portal/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/super-portal/public ./apps/super-portal/public

CMD ["node", "apps/super-portal/server.js"]
