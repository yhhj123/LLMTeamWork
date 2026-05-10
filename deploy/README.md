# Deploying LLM TeamWork

## TL;DR

On the target server (root or sudo):

```bash
curl -fsSL https://raw.githubusercontent.com/yhhj123/LLMTeamWork/claude/multi-agent-collaboration-platform-8IvIF/deploy/install.sh \
  | DOMAIN=tm.9swt.com bash
```

That's it. Within ~1 minute the stack is up at `https://tm.9swt.com/`
with a real Let's Encrypt certificate (assuming DNS is pointed at the host
and ports 80/443 are open).

## What gets installed

The script will:

1. `apt-get install` git + curl + Docker if any are missing.
2. `git clone` (or pull) the repo into `/opt/llm-teamwork`.
3. Write `/opt/llm-teamwork/.env` with `DOMAIN=tm.9swt.com`.
4. `docker compose up -d --build`, which starts:
   - **app** — the Next.js server, listening on the internal docker network.
   - **caddy** — reverse proxy on host ports 80/443 with automatic
     Let's Encrypt cert renewal.
5. Print health and the public URLs.

## Prerequisites on the server

- Ubuntu 20.04+ / Debian 11+ / RHEL 8+ (apt or yum). Other distros need manual
  Docker install.
- Public ports **80 and 443** open (Caddy needs both: 80 for ACME HTTP-01,
  443 for HTTPS).
- DNS A record for `tm.9swt.com` → this server's public IP.
- Outbound HTTPS to `acme-v02.api.letsencrypt.org` and `get.docker.com`.

## DNS

```
tm.9swt.com.  IN  A  101.37.79.117
```

After updating DNS, verify with:

```bash
dig +short tm.9swt.com
```

If it returns the wrong IP (or nothing), wait for propagation before running
the script — Caddy will keep retrying, but you'll get faster feedback.

## Volumes / data

- `data` (Docker named volume) — SQLite database + uploaded attachments.
- `caddy_data` / `caddy_config` — Caddy's state including the TLS cert.

To back up:

```bash
docker run --rm \
  -v llmteamwork_data:/data \
  -v "$(pwd)":/backup \
  alpine tar czf /backup/llm-teamwork-data-$(date +%F).tar.gz -C /data .
```

## Upgrading

Re-run the same install command. It pulls the latest commit on the branch
and runs `docker compose up -d --build`.

## Without a domain (HTTP-only)

If you don't have a domain ready and just want to test on the server's IP:

```bash
# On the server, after cloning:
cd /opt/llm-teamwork
docker compose -f docker-compose.yml up -d --build app

# Map host port 80 -> app:3000 manually:
docker run -d --name llm-teamwork-port \
  --network llmteamwork_default \
  -p 80:80 nginx:alpine \
  sh -c 'echo "server { listen 80; location / { proxy_pass http://app:3000; } }" > /etc/nginx/conf.d/default.conf && nginx -g "daemon off;"'
```

…or simpler: edit `docker-compose.yml`, comment out the `caddy` service, and
add `ports: ["80:3000"]` under `app`.

## Postgres instead of SQLite

For multi-replica or higher load, swap to Postgres:

1. Edit `prisma/schema.prisma`: change `provider = "sqlite"` to `"postgresql"`.
2. Add a `db` service to `docker-compose.yml`:
   ```yaml
   db:
     image: postgres:16-alpine
     environment:
       POSTGRES_USER: llm
       POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
       POSTGRES_DB: llm_teamwork
     volumes: [pgdata:/var/lib/postgresql/data]
   ```
3. In `app.environment`, set `DATABASE_URL=postgresql://llm:${POSTGRES_PASSWORD}@db:5432/llm_teamwork`.
4. Re-run the install script.

## Troubleshooting

```bash
# Live logs
docker compose -f /opt/llm-teamwork/docker-compose.yml logs -f app
docker compose -f /opt/llm-teamwork/docker-compose.yml logs -f caddy

# Inspect cert status
docker compose -f /opt/llm-teamwork/docker-compose.yml exec caddy \
  caddy list-certificates

# Force re-issue a cert (after fixing DNS, etc.)
docker compose -f /opt/llm-teamwork/docker-compose.yml restart caddy
```
