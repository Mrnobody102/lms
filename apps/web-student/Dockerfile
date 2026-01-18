FROM node:18-alpine AS base

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scan-imports web-student --docker

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

RUN pnpm turbo build --filter=web-student...

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/web-student/next.config.js .
COPY --from=installer /app/apps/web-student/package.json .
COPY --from=installer --chown=nextjs:nodejs /app/apps/web-student/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web-student/.next/static ./apps/web-student/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web-student/public ./apps/web-student/public

CMD ["node", "apps/web-student/server.js"]
