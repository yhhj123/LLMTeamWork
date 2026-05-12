#!/usr/bin/env bash
# LLM TeamWork — server bootstrap (nginx-front model).
#
# Brings up the LLM TeamWork app container on 127.0.0.1:$APP_HOST_PORT (default
# 3050). Use this when the host already runs an nginx that owns 80/443; that
# nginx then reverse-proxies tm.9swt.com to our container. See
# deploy/nginx/tm.9swt.com.conf for the matching nginx vhost.
#
# Defaults are tuned for mainland China hosts:
#   - Repo cloned from a Gitee mirror (faster than github.com)
#   - Docker Hub registry mirrors written to /etc/docker/daemon.json
#   - Alpine package mirror is swapped to mirrors.aliyun.com inside the image
#
# Run on the target machine as root:
#
#   curl -fsSL https://gitee.com/yhhj123/llmteamwork/raw/main/deploy/install.sh \
#     | bash
#
# Or, if you prefer the original GitHub source:
#
#   REPO_URL=https://github.com/yhhj123/LLMTeamWork.git \
#   curl -fsSL https://raw.githubusercontent.com/yhhj123/LLMTeamWork/main/deploy/install.sh \
#     | bash
#
# Optional env vars:
#   REPO_URL           override the repo URL (default: Gitee mirror)
#   BRANCH             branch / ref to deploy (default: main)
#   DEST               install location (default: /opt/llm-teamwork)
#   APP_HOST_PORT      host port to bind (default 3050)
#   DOMAIN             vhost server_name (default tm.9swt.com)
#   INSTALL_NGINX_CONF =1 to copy nginx vhost to /etc/nginx/conf.d/ and reload
#   SKIP_DOCKER_MIRROR =1 to skip writing /etc/docker/daemon.json

set -euo pipefail

REPO_URL="${REPO_URL:-https://gitee.com/yhhj123/llmteamwork.git}"
BRANCH="${BRANCH:-main}"
DEST="${DEST:-/opt/llm-teamwork}"
APP_HOST_PORT="${APP_HOST_PORT:-3050}"
DOMAIN="${DOMAIN:-tm.9swt.com}"
INSTALL_NGINX_CONF="${INSTALL_NGINX_CONF:-0}"
SKIP_DOCKER_MIRROR="${SKIP_DOCKER_MIRROR:-0}"

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

# --- Docker Hub registry mirror (idempotent, non-destructive) ---------------
configure_docker_mirror() {
  [ "$SKIP_DOCKER_MIRROR" = "1" ] && { log "SKIP_DOCKER_MIRROR=1, skipping."; return; }
  local dst=/etc/docker/daemon.json
  if [ -f "$dst" ] && grep -q registry-mirrors "$dst" 2>/dev/null; then
    log "Docker registry mirror already configured in $dst."
    return
  fi
  if [ -f "$dst" ] && [ -s "$dst" ]; then
    warn "$dst exists but has no registry-mirrors; leaving it alone to avoid clobbering."
    warn "Add this manually if you want a CN mirror:"
    warn '  "registry-mirrors": ["https://docker.mirrors.ustc.edu.cn", "https://registry.cn-hangzhou.aliyuncs.com"]'
    return
  fi
  log "Writing $dst with China-friendly registry mirrors..."
  mkdir -p /etc/docker
  cat > "$dst" <<'JSON'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://registry.cn-hangzhou.aliyuncs.com",
    "https://docker.m.daocloud.io"
  ]
}
JSON
  systemctl restart docker 2>/dev/null || service docker restart 2>/dev/null || true
}
configure_docker_mirror

# --- Sync repo (clone or fetch) ---------------------------------------------
log "Syncing repo at $DEST (origin: $REPO_URL, branch: $BRANCH)..."
if [ ! -d "$DEST/.git" ]; then
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$DEST"
else
  # Auto-switch origin if it differs (e.g., upgrading from GitHub-pinned install).
  current_url=$(git -C "$DEST" remote get-url origin 2>/dev/null || echo "")
  if [ -n "$current_url" ] && [ "$current_url" != "$REPO_URL" ]; then
    log "Updating remote origin: $current_url -> $REPO_URL"
    git -C "$DEST" remote set-url origin "$REPO_URL"
  fi
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
  Repo origin    : $(git -C "$DEST" remote get-url origin)

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
