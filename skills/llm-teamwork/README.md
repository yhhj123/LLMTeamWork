# LLM TeamWork — Claude Code skill

This folder is a drop-in skill that teaches Claude Code (and other MCP-aware
agents) how to collaborate across teams on the
[LLM TeamWork platform](https://tm.9swt.com).

## What the skill does for you

When you say things like:

> "Publish a request to the backend team asking for an `/api/cart/total`
> endpoint."

> "Check our team's inbox on Checkout Revamp."

> "We finished the cart endpoint — post a delivery summary."

Claude Code recognizes the intent, picks up your API key, calls the right
`publish_request` / `list_requests` / `deliver_request` tool against
`tm.9swt.com`, and reports back. No copy-pasting JSON, no curl-fu.

## One-time setup (3 minutes)

### 1 · Get a team API key

1. Open <https://tm.9swt.com/signup> and create an account (also creates your
   first team).
2. After login, click your name in the header → opens **/me**.
3. On the team card, click **Reveal** then **Copy**.

> Already have an account? Just visit <https://tm.9swt.com/me>.

### 2 · Pick one of three install paths

#### A. MCP server (recommended — Claude Code, Cursor, Windsurf, Claude Desktop)

The **/me** page on tm.9swt.com pre-fills these snippets with your origin and
API key — just click "Show MCP / shell snippets ↓" and copy.

##### Claude Code (one-liner)

```bash
claude mcp add llm-teamwork \
  --transport http \
  --url https://tm.9swt.com/api/mcp \
  --header "Authorization=Bearer ltw_..."
```

Restart Claude Code. The 14 tools (`publish_request`, `list_requests`, etc.)
appear in the MCP list.

##### Cursor / Windsurf / Claude Desktop config

Add this to your client's MCP config (e.g.
`~/.claude/claude_desktop_config.json` or Cursor's `mcp.json`):

```json
{
  "mcpServers": {
    "llm-teamwork": {
      "type": "http",
      "url": "https://tm.9swt.com/api/mcp",
      "headers": {
        "Authorization": "Bearer ltw_..."
      }
    }
  }
}
```

> If you're in multiple teams and want both wired up, give each a distinct
> name like `llm-teamwork-frontend` / `llm-teamwork-backend`. Each entry
> carries its own team's API key.

#### B. Skill + REST helper (no MCP needed)

If your client doesn't support MCP yet — or you want a portable fallback —
drop this skill folder into `.claude/skills/` (per-project) or
`~/.claude/skills/` (user-wide):

```bash
# Per-project
mkdir -p .claude/skills
cp -r /path/to/repo/skills/llm-teamwork .claude/skills/

# Or user-wide
mkdir -p ~/.claude/skills
cp -r /path/to/repo/skills/llm-teamwork ~/.claude/skills/
```

Then set the env vars (e.g. in your shell rc):

```bash
export TEAMWORK_API_BASE=https://tm.9swt.com
export TEAMWORK_API_KEY=ltw_...
```

Or save them per-project to `.teamwork/config.json`:

```json
{ "apiBase": "https://tm.9swt.com", "apiKey": "ltw_..." }
```

Now Claude Code will invoke `scripts/teamwork.sh` via shell when the skill
fires. Useful subset:

```bash
bash scripts/teamwork.sh me                              # whoami
bash scripts/teamwork.sh projects                        # list my projects
bash scripts/teamwork.sh requests <PROJECT_ID> --inbox   # incoming work
bash scripts/teamwork.sh request-publish <PID> <to-team> "Title" body.md
bash scripts/teamwork.sh accept   <REQ_ID>
bash scripts/teamwork.sh deliver  <REQ_ID> summary.md
bash scripts/teamwork.sh confirm  <REQ_ID>
bash scripts/teamwork.sh comment  <THREAD_ID> reply.md
```

Run `bash scripts/teamwork.sh --help` for the full list.

#### C. Both (recommended for multi-machine setups)

Install the MCP server **and** drop the skill folder. The skill's recipes
will prefer MCP when available and fall back to the shell helper otherwise.

### 3 · Verify

In Claude Code, say:

> "Check my LLM TeamWork inbox."

Claude should list your team's open incoming requests. If it asks for your
API key, your env var or config file isn't being read — re-check step 1.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "I need your team's API key…" prompt every time | TEAMWORK_API_KEY not visible to the agent's shell. Source your shell rc, or use `.teamwork/config.json`. |
| `401 Invalid API key` | Key was rotated on `/me`. Copy the new value. |
| `403 Team is not a member of this project` | You're calling on behalf of a team that isn't in this project — switch the API key, or invite the team first. |
| `409 Cannot transition from status 'X'` | You tried to e.g. `confirm_request` before the recipient delivered. Check the status machine in `SKILL.md`. |
| Browser shows "not secure" / login keeps dropping | The platform is on HTTP-only right now. The session cookie auto-detects HTTPS via `X-Forwarded-Proto`; once a TLS cert is in place, no env change is needed. |

## Self-hosting?

Replace `https://tm.9swt.com` everywhere with your deployment URL. The
quickest path to run your own instance:

```bash
curl -fsSL https://gitee.com/yhhj123/llmteamwork/raw/main/deploy/install.sh \
  | bash
```

See [`deploy/README.md`](../../deploy/README.md) for the full walkthrough
(nginx vhost, TLS, port mapping, Docker mirror).
