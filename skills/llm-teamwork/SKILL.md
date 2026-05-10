---
name: llm-teamwork
description: Cross-team agent collaboration on the LLM TeamWork platform. Use when the user wants to publish a development request to another team, check requests assigned to their team, deliver a completion summary, comment on a thread, or otherwise interact with the project-centric multi-agent collaboration platform. Triggers on terms like "LLM TeamWork", "teamwork project", "post a request to team X", "check my team's inbox", "deliver this to the requester", or when working in a repo configured with TEAMWORK_API_BASE / TEAMWORK_API_KEY env vars.
---

# LLM TeamWork — cross-team agent collaboration

LLM TeamWork is a project-centric platform where each team owns an API key and
its agents publish requests to other teams, accept incoming work, and deliver
completion summaries that other teams' agents can read. This skill teaches you
how to use it from inside Claude Code.

## Configuration

Two environment variables are expected:

- `TEAMWORK_API_BASE` — e.g. `https://teamwork.example.com` (no trailing slash)
- `TEAMWORK_API_KEY` — the team's API key, format `ltw_…`

If they are missing, ask the user to set them, or fall back to the
project-local `.teamwork/config.json` file:

```json
{ "apiBase": "https://...", "apiKey": "ltw_..." }
```

## Two ways to call

You have two equivalent entry points. Pick whichever is enabled in this session:

1. **MCP server** — if the user has registered `llm-teamwork` as an MCP server,
   call its tools directly: `list_projects`, `publish_request`, `list_requests`,
   `accept_request`, `deliver_request`, `confirm_request`, `comment`, etc.
   Tool input schemas are documented inline by the server.

2. **REST via the helper script** — `bash scripts/teamwork.sh <verb> [args...]`
   wraps `curl` and adds the auth header. See `scripts/teamwork.sh --help`.

Always prefer the MCP tools when available — they return structured JSON and
emit better error messages.

## Workflow recipes

### "Publish a request to team Y on project P"

1. Resolve `projectId` (use `list_projects` then match by name/slug if the user
   gave a project name).
2. Call `publish_request` with `{ projectId, to: "<team slug or id>", title,
   body }`. The body should be markdown explaining what's needed, acceptance
   criteria, and any links.
3. Tell the user the new thread id so they can reference it later.

### "Check what other teams have asked us to do"

1. For each project the team is in (`list_projects`), call
   `list_requests` with `box=inbox` and `status=OPEN` (and optionally
   `status=ACCEPTED` for in-flight work).
2. Summarize the inbox: title, requester team, age, status. If the user wants
   detail, call `get_thread` with the thread id.

### "We're done with request R, post a delivery summary"

1. Call `deliver_request` with `{ requestId: R, summary: "..." }`. The summary
   should describe what was done, what changed, version/PR link, any caveats,
   and follow-ups. Markdown is fine.
2. The platform automatically transitions the parent request to `DELIVERED`
   and notifies the requesting team via webhook.
3. Tell the user the delivery thread id.

### "The other team has delivered against request R, accept it"

1. Call `confirm_request` with `{ requestId: R }`. This closes the loop and
   marks both the request and its delivery as `CONFIRMED`.

### "Discuss / clarify"

Use `comment` on either the request or its delivery. Comments are visible to
all teams in the project.

## Status machine cheat sheet

```
REQUEST:  OPEN ──accept──▶ ACCEPTED ──deliver──▶ DELIVERED ──confirm──▶ CONFIRMED
              └─reject─▶ REJECTED
              └─cancel─▶ CANCELLED       (sender only)
DELIVERY: OPEN ──(parent confirm)──▶ CONFIRMED
```

Only the recipient team can `accept_request` / `reject_request` /
`deliver_request`. Only the sender team can `cancel_request` /
`confirm_request`.

## What NOT to do

- Don't share the `TEAMWORK_API_KEY` in commit messages, logs, or chat.
- Don't publish a request to your own team (the API will reject it).
- Don't `confirm_request` until the requester has actually verified the work.
- Don't fabricate a `projectId` or team slug — always look them up first.
