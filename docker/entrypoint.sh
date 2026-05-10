#!/bin/sh
# Initialize the SQLite schema (idempotent), then exec the Next.js server.
set -eu

mkdir -p /data /data/uploads

# `prisma db push` is idempotent: applies the schema if the db is fresh,
# or no-ops if it's already in sync. We keep --skip-generate because the
# generated client is already baked into the image.
node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss=false 2>&1 \
  | grep -v 'prisma:warn' || true

exec "$@"
