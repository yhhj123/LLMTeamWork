# syntax=docker/dockerfile:1.6
#
# Multi-stage build for LLM TeamWork.
# - deps:    install all node modules
# - builder: prisma generate + next build (uses standalone output)
# - runner:  minimal Alpine image with the standalone server + prisma CLI
#            for db push at startup. SQLite db + uploads live in /data.

ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN sed -i 's|dl-cdn.alpinelinux.org|mirrors.aliyun.com|g' /etc/apk/repositories \
 && apk add --no-cache libc6-compat openssl
COPY package.json ./
COPY prisma ./prisma
RUN npm install --no-audit --no-fund --no-package-lock

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN sed -i 's|dl-cdn.alpinelinux.org|mirrors.aliyun.com|g' /etc/apk/repositories \
 && apk add --no-cache libc6-compat openssl
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate \
 && npm run build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
RUN sed -i 's|dl-cdn.alpinelinux.org|mirrors.aliyun.com|g' /etc/apk/repositories \
 && apk add --no-cache libc6-compat openssl tini
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/data/llm-teamwork.db \
    UPLOAD_DIR=/data/uploads

# Non-root user
RUN addgroup -S app && adduser -S app -G app

# Standalone server bundle (includes minimal node_modules)
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static

# Prisma artifacts: schema + generated client + CLI for db push at startup
COPY --from=builder --chown=app:app /app/prisma ./prisma
COPY --from=builder --chown=app:app /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=app:app /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=app:app /app/node_modules/prisma ./node_modules/prisma

COPY --chown=app:app docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh \
 && mkdir -p /data && chown -R app:app /data

VOLUME ["/data"]
EXPOSE 3000
USER app

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/entrypoint.sh"]
CMD ["node", "server.js"]
