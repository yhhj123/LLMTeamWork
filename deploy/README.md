# Deploying LLM TeamWork (nginx-front model)

The host already runs nginx on 80/443 (alongside other vhosts), so the LLM
TeamWork container binds **only to `127.0.0.1:3050`** and is fronted by an
nginx vhost.

## TL;DR

On the target server (root or sudo):

```bash
curl -fsSL https://gitee.com/yhhj123/llmteamwork/raw/main/deploy/install.sh \
  | bash
```

That brings up the app container at `http://127.0.0.1:3050/`. Verify with:

```bash
curl -fsS http://127.0.0.1:3050/api/mcp
```

> The default repo source is the Gitee mirror (faster from mainland China).
> The mirror auto-syncs from the GitHub upstream daily. To force the original
> GitHub source instead, prepend `REPO_URL=https://github.com/yhhj123/LLMTeamWork.git`.

Then add the nginx vhost (next section).

## Wire up nginx

1. Copy `deploy/nginx/tm.9swt.com.conf` into the nginx config dir:

   ```bash
   cp /opt/llm-teamwork/deploy/nginx/tm.9swt.com.conf /etc/nginx/conf.d/
   ```

   Or pass `INSTALL_NGINX_CONF=1` to `install.sh` and it will copy it for you.

2. Open the file and fix the cert paths to match what's on this box. Two
   common cases:

   - **Reuse an existing `*.9swt.com` wildcard cert** (whatever path your
     other 9swt vhosts use):
     ```nginx
     ssl_certificate     /etc/nginx/ssl/9swt.com/fullchain.pem;
     ssl_certificate_key /etc/nginx/ssl/9swt.com/privkey.pem;
     ```
   - **Issue a fresh per-host cert with certbot**:
     ```bash
     mkdir -p /var/www/letsencrypt
     certbot certonly --webroot -w /var/www/letsencrypt -d tm.9swt.com
     # ...gives you /etc/letsencrypt/live/tm.9swt.com/{fullchain,privkey}.pem
     ```

3. Reload nginx:

   ```bash
   nginx -t && systemctl reload nginx
   ```

4. Browse https://tm.9swt.com/.

## Why this layout

```
                    Internet
                       │
                  443 ▼ 80
            ┌──────────────────┐
            │   host nginx     │  (already running, owns 80/443 + other vhosts)
            └─────────┬────────┘
                      │ proxy_pass
                  3050▼ (loopback only)
            ┌──────────────────┐
            │  llm-teamwork    │  Docker container, Next.js standalone
            │   (Next.js)      │
            └─────────┬────────┘
                      │
                  /data volume
                 (SQLite + uploads)
```

- The container is **not** reachable from the public internet.
- Existing nginx vhosts on this box are unaffected.
- Switching to a different proxy (Caddy/Traefik) later is a one-file change.

## Volumes / data

- `data` — SQLite database + uploaded attachments. Inspect with:

  ```bash
  docker volume inspect llm-teamwork_data || \
    docker volume inspect llmteamwork_data
  ```

Backup:

```bash
docker run --rm \
  -v llm-teamwork_data:/data \
  -v "$(pwd)":/backup \
  alpine tar czf /backup/llm-teamwork-data-$(date +%F).tar.gz -C /data .
```

## Upgrading

Re-run the install command — it pulls the latest commit on the branch and
rebuilds the image in place. No nginx changes needed unless the vhost spec
itself was updated.

## Choosing a different host port

If `3050` is also in use:

```bash
APP_HOST_PORT=3050 \
curl -fsSL https://gitee.com/yhhj123/llmteamwork/raw/main/deploy/install.sh \
  | bash
```

Don't forget to update the `upstream` block in the nginx vhost.

## Docker Hub access from mainland China

The install script writes `/etc/docker/daemon.json` with three registry mirrors
(USTC, Aliyun, DaoCloud) if no daemon.json exists. To opt out, pass
`SKIP_DOCKER_MIRROR=1`. If an existing daemon.json is present, the script
leaves it alone and prints what to add manually.

## Postgres instead of SQLite

For multi-replica deployments, switch the Prisma datasource provider to
`postgresql`, add a `db` service to `docker-compose.yml`, and set
`DATABASE_URL=postgresql://user:pass@db:5432/llm_teamwork` on the app
service. Re-run `install.sh`.

## Troubleshooting

```bash
# Container logs
docker compose -f /opt/llm-teamwork/docker-compose.yml logs -f app

# Confirm nothing else is on 3050
ss -tlnp | grep ':3050'

# Test the upstream directly (bypasses nginx)
curl -fsS http://127.0.0.1:3050/

# nginx tail
tail -f /var/log/nginx/tm.9swt.com.error.log
```
