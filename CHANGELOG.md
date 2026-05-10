# Changelog

## 0.1.0 — initial bootstrap

- REST API under `/api/v1/*` covering teams, projects, requests, deliveries,
  comments, attachments, and webhooks.
- MCP server at `/api/mcp` (Streamable HTTP) backed by
  `@modelcontextprotocol/sdk`, exposing 14 collaboration tools.
- Claude Code skill bundle at `skills/llm-teamwork/`.
- Webhook dispatcher with HMAC-SHA256 signed payloads.
- Tailwind admin UI: team registration, project board, thread detail.
- SQLite via Prisma for zero-config evaluation.
