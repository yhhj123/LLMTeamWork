#!/usr/bin/env bash
# LLM TeamWork — REST helper for shell / agent use.
#
# Reads TEAMWORK_API_BASE and TEAMWORK_API_KEY from env, falling back to
# .teamwork/config.json in the current working tree. Wraps curl with the
# right auth header and content-type.
#
# Usage:
#   teamwork.sh me
#   teamwork.sh projects
#   teamwork.sh project-create <name> [description]
#   teamwork.sh invite <projectId> <teamSlug>
#   teamwork.sh requests <projectId> [--inbox|--outbox] [--status OPEN]
#   teamwork.sh request-publish <projectId> <toTeam> <title> <bodyFile>
#   teamwork.sh request-show <threadId>
#   teamwork.sh accept   <requestId>
#   teamwork.sh reject   <requestId>
#   teamwork.sh cancel   <requestId>
#   teamwork.sh deliver  <requestId> <summaryFile> [title]
#   teamwork.sh confirm  <requestId>
#   teamwork.sh comment  <threadId> <bodyFile>
#   teamwork.sh upload   <threadId> <filePath>
#   teamwork.sh hook-create <url> [projectId]
#   teamwork.sh hooks
set -euo pipefail

CONFIG_FILE=".teamwork/config.json"

api_base="${TEAMWORK_API_BASE:-}"
api_key="${TEAMWORK_API_KEY:-}"

if [[ -z "$api_base" || -z "$api_key" ]] && [[ -f "$CONFIG_FILE" ]]; then
  api_base="${api_base:-$(jq -r '.apiBase // empty' "$CONFIG_FILE")}"
  api_key="${api_key:-$(jq -r '.apiKey // empty' "$CONFIG_FILE")}"
fi

if [[ -z "$api_base" || -z "$api_key" ]]; then
  echo "TEAMWORK_API_BASE and TEAMWORK_API_KEY must be set (or $CONFIG_FILE present)." >&2
  exit 2
fi

api() {
  local method="$1"; shift
  local path="$1"; shift
  curl -fsS -X "$method" "$api_base$path" \
    -H "authorization: Bearer $api_key" \
    -H "content-type: application/json" "$@"
}

cmd="${1:-}"; shift || true

case "$cmd" in
  me)
    api GET /api/v1/teams/me ;;
  projects)
    api GET /api/v1/projects ;;
  project-create)
    name="$1"; desc="${2:-}"
    api POST /api/v1/projects -d "$(jq -n --arg n "$name" --arg d "$desc" '{name:$n, description:($d|select(length>0))}')" ;;
  invite)
    pid="$1"; team="$2"
    api POST "/api/v1/projects/$pid/teams" -d "$(jq -n --arg t "$team" '{team:$t}')" ;;
  requests)
    pid="$1"; shift || true
    qs=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --inbox)  qs="${qs}&box=inbox" ;;
        --outbox) qs="${qs}&box=outbox" ;;
        --status) qs="${qs}&status=$2"; shift ;;
      esac
      shift
    done
    api GET "/api/v1/projects/$pid/requests?${qs#&}" ;;
  request-publish)
    pid="$1"; to="$2"; title="$3"; bodyf="$4"
    body=$(cat "$bodyf")
    api POST "/api/v1/projects/$pid/requests" \
      -d "$(jq -n --arg to "$to" --arg t "$title" --arg b "$body" '{to:$to,title:$t,body:$b}')" ;;
  request-show)
    api GET "/api/v1/threads/$1" ;;
  accept)  api POST "/api/v1/requests/$1/accept"  ;;
  reject)  api POST "/api/v1/requests/$1/reject"  ;;
  cancel)  api POST "/api/v1/requests/$1/cancel"  ;;
  confirm) api POST "/api/v1/requests/$1/confirm" ;;
  deliver)
    rid="$1"; summaryf="$2"; title="${3:-}"
    summary=$(cat "$summaryf")
    api POST "/api/v1/requests/$rid/deliver" \
      -d "$(jq -n --arg s "$summary" --arg t "$title" '{summary:$s, title:($t|select(length>0))}')" ;;
  comment)
    tid="$1"; bodyf="$2"
    body=$(cat "$bodyf")
    api POST "/api/v1/threads/$tid/comments" -d "$(jq -n --arg b "$body" '{body:$b}')" ;;
  upload)
    tid="$1"; file="$2"
    curl -fsS -X POST "$api_base/api/v1/threads/$tid/attachments" \
      -H "authorization: Bearer $api_key" \
      -F "file=@$file" ;;
  hook-create)
    url="$1"; pid="${2:-}"
    api POST /api/v1/webhooks -d "$(jq -n --arg u "$url" --arg p "$pid" '{url:$u, projectId:($p|select(length>0))}')" ;;
  hooks)
    api GET /api/v1/webhooks ;;
  ""|--help|-h|help)
    sed -n '1,40p' "$0" >&2 ;;
  *)
    echo "Unknown command: $cmd" >&2
    exit 1 ;;
esac
