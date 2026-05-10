#!/usr/bin/env bash
# LLM TeamWork — one-shot server bootstrap.
#
# Run on the target machine as root:
#
#   curl -fsSL https://raw.githubusercontent.com/yhhj123/LLMTeamWork/claude/multi-agent-collaboration-platform-8IvIF/deploy/install.sh \
#     | DOMAIN=tm.9swt.com bash
#
# What it does:
#   1. Installs git + Docker + the Compose plugin if missing.
#   2. Clones (or pulls) this repo into /opt/llm-teamwork.
#   3. Writes /opt/llm-teamwork/.env with $DOMAIN.
#   4. Builds the app image and brings up `app + caddy` via compose.
#   5. Prints the public URLs.
#
# Re-running is safe; it acts as an upgrade-in-place.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/yhhj123/LLMTeamWork.git}"
BRANCH="${BRANCH:-claude/multi-agent-collaboration-platform-8IvIF}"
DEST="${DEST:-/opt/llm-teamwork}"
DOMAIN="${DOMAIN:-tm.9swt.com}"

log() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!! \033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mxx \033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "This script must be run as root (use sudo)."

log "Preparing apt..."
export DEBIAN_FRONTEND=noninteractive
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -yqq ca-certificates curl git
elif command -v yum >/dev/null 2>&1; then
  yum install -y ca-certificates curl git
else
  warn "Unknown package manager; assuming git + curl are already installed."
fi

if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
fi

# Compose plugin: prefer `docker compose`; fall back to legacy `docker-compose` if needed.
if ! docker compose version >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    apt-get install -yqq docker-compose-plugin || true
  fi
fi
if ! docker compose version >/dev/null 2>&1; then
  die "docker compose plugin not available; install it manually then re-run."
fi

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

log "Writing .env (DOMAIN=$DOMAIN)"
printf 'DOMAIN=%s\n' "$DOMAIN" > .env
chmod 600 .env

log "Building image and bringing up the stack..."
docker compose pull --ignore-pull-failures || true
docker compose up -d --build --remove-orphans

log "Waiting for healthcheck..."
for i in $(seq 1 30); do
  if docker compose ps --status running --services | grep -q '^app$'; then
    if docker inspect --format '{{.State.Health.Status}}' llm-teamwork 2>/dev/null | grep -q healthy; then
      break
    fi
  fi
  sleep 2
done

docker compose ps

cat <<EOF

\033[1;32mDeployment complete.\033[0m

  Web UI / API : https://${DOMAIN}/
  MCP endpoint : https://${DOMAIN}/api/mcp
  Docs page    : https://${DOMAIN}/docs

DNS check: \`dig +short ${DOMAIN}\` should return this server's IP.
If it doesn't yet, point an A record to it; Caddy will then issue the
TLS certificate within ~30 seconds.

Useful commands:
  docker compose -f $DEST/docker-compose.yml logs -f app
  docker compose -f $DEST/docker-compose.yml logs -f caddy
  docker compose -f $DEST/docker-compose.yml restart
EOF
