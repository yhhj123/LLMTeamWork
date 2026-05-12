#!/usr/bin/env bash
# LLM TeamWork — server bootstrap (nginx-front model).
#
# Brings up the LLM TeamWork app container on 127.0.0.1:$APP_HOST_PORT (default
# 3050). Use this when the host already runs an nginx that owns 80/443; that
# nginx then reverse-proxies tm.9swt.com to our container. See
# deploy/nginx/tm.9swt.com.conf for the matching nginx vhost.
#
# Run on the target machine as root:
#
#   curl -fsSL https://raw.githubusercontent.com/yhhj123/LLMTeamWork/main/deploy/install.sh \
#     | bash
#
# Optional env vars:
#   APP_HOST_PORT      host port to bind (default 3050)
#   INSTALL_NGINX_CONF =1 to copy nginx vhost to /etc/nginx/conf.d/ and reload
#   DOMAIN             vhost server_name (default tm.9swt.com)

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/yhhj123/LLMTeamWork.git}"
BRANCH="${BRANCH:-main}"
DEST="${DEST:-/opt/llm-teamwork}"
APP_HOST_PORT="${APP_HOST_PORT:-3050}"
DOMAIN="${DOMAIN:-tm.9swt.com}"
INSTALL_NGINX_CONF="${INSTALL_NGINX_CONF:-0}"

log()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!! \033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mxx \033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run as root (or via sudo)."

log "Ensuring git, curl, docker are installed..."
export DEBIAN_FRONTEND=noninteractive
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -yqq ca-certificates curl git
elif command -v yum >/dev/null 2>&1; then
  yum install -y ca-certificates curl git
fi

if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
fi

if ! docker compose version >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    apt-get install -yqq docker-compose-plugin || true
  fi
fi
docker compose version >/dev/null 2>&1 \
  || die "docker compose plugin missing; install it manually."

systemctl enable --now docker >/dev/null 2>&1 || true

log "Syncing repo at $DEST (branch: $BRANCH)..."
if [ ! -d "$DEST/.git" ]; then
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$DEST"
else
  git -C "$DEST" fetch origin "$BRANCH"
  git -C "$DEST" checkout "$BRANCH"
  git -C "$DEST" reset --hard "origin/$BRANCH"
fi

cd "$DEST"

# Sanity-check the host port is free (nginx, etc., must not own it).
if ss -tlnp 2>/dev/null | awk '{print $4}' | grep -E "(:|^)${APP_HOST_PORT}$" >/dev/null; then
  warn "Port ${APP_HOST_PORT} on the host is already in use. Set APP_HOST_PORT to a free port and re-run."
fi

log "Building image and bringing up the app container..."
APP_HOST_PORT="$APP_HOST_PORT" docker compose up -d --build --remove-orphans

log "Waiting for healthcheck..."
for _ in $(seq 1 30); do
  state=$(docker inspect --format '{{.State.Health.Status}}' llm-teamwork 2>/dev/null || echo unknown)
  [ "$state" = "healthy" ] && break
  sleep 2
done
docker compose ps

if [ "$INSTALL_NGINX_CONF" = "1" ]; then
  log "Installing nginx vhost for $DOMAIN..."
  CONF_SRC="$DEST/deploy/nginx/tm.9swt.com.conf"
  CONF_DST="/etc/nginx/conf.d/${DOMAIN}.conf"
  if [ ! -d /etc/nginx/conf.d ]; then
    die "/etc/nginx/conf.d not found; install nginx config manually."
  fi
  if [ "$DOMAIN" != "tm.9swt.com" ]; then
    sed "s/tm\\.9swt\\.com/${DOMAIN}/g" "$CONF_SRC" > "$CONF_DST"
  else
    cp "$CONF_SRC" "$CONF_DST"
  fi
  warn "nginx vhost copied to $CONF_DST."
  warn "Edit it to set the correct ssl_certificate / ssl_certificate_key paths,"
  warn "then run: nginx -t && systemctl reload nginx"
fi

cat <<EOF

Deployment complete.

  App listening at: http://127.0.0.1:${APP_HOST_PORT}/  (loopback only)
  Container name : llm-teamwork
  Volume         : llm_teamwork_data (or 'llmteamwork_data' depending on compose project name)

Next steps to expose it on https://${DOMAIN}/ :

  1. Drop deploy/nginx/tm.9swt.com.conf into /etc/nginx/conf.d/ and adjust
     ssl_certificate paths to a cert you already have, e.g. a *.9swt.com
     wildcard. (Or re-run with INSTALL_NGINX_CONF=1 to copy automatically.)
  2. nginx -t && systemctl reload nginx

Local probe to verify the container itself is fine:

  curl -fsS http://127.0.0.1:${APP_HOST_PORT}/api/mcp

Logs:
  docker compose -f $DEST/docker-compose.yml logs -f app
EOF
