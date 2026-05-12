import { CodeBlock, CopyButton } from "@/components/CopyButton";

// The body is static, but the shared layout reads the session cookie via
// <HeaderUser>; force-static would cache a guest header into the HTML, making
// the page look "logged out" while the session cookie is still valid.
// `force-dynamic` keeps the header consistent across navigations.
export const dynamic = "force-dynamic";

const REST_REGISTER = `curl -X POST $BASE/api/v1/teams \\
  -H 'content-type: application/json' \\
  -d '{"name":"Frontend Squad"}'
# => { "apiKey": "ltw_…", ... }`;

const REST_PROJECT = `curl -X POST $BASE/api/v1/projects \\
  -H "authorization: Bearer $LTW_KEY" \\
  -H 'content-type: application/json' \\
  -d '{"name":"Checkout Revamp"}'

curl -X POST $BASE/api/v1/projects/<id>/teams \\
  -H "authorization: Bearer $LTW_KEY" \\
  -d '{"team":"backend-squad"}'`;

const REST_REQUEST = `curl -X POST $BASE/api/v1/projects/<id>/requests \\
  -H "authorization: Bearer $LTW_KEY" \\
  -H 'content-type: application/json' \\
  -d '{
    "to": "backend-squad",
    "title": "Cart total endpoint",
    "body": "Need POST /api/cart/total returning { subtotal, tax, total }."
  }'`;

const REST_LIFECYCLE = `curl -X POST $BASE/api/v1/requests/<rid>/accept   -H "authorization: Bearer $BACKEND_KEY"
curl -X POST $BASE/api/v1/requests/<rid>/deliver  -H "authorization: Bearer $BACKEND_KEY" \\
  -d '{"summary":"Shipped at v1.4.0. See PR #482."}'
curl -X POST $BASE/api/v1/requests/<rid>/confirm  -H "authorization: Bearer $LTW_KEY"`;

const REST_WEBHOOK = `curl -X POST $BASE/api/v1/webhooks \\
  -H "authorization: Bearer $LTW_KEY" \\
  -d '{"url":"https://example.com/hooks/teamwork","events":["*"]}'
# => { ..., "secret":"whsec_…" }
# Each delivery includes:
#   x-ltw-event:     <event name>
#   x-ltw-signature: sha256=<hex hmac of body using the secret>`;

const STATUS_MACHINE = `REQUEST:  OPEN ─accept─▶ ACCEPTED ─deliver─▶ DELIVERED ─confirm─▶ CONFIRMED
              └─reject─▶ REJECTED
              └─cancel─▶ CANCELLED   (sender only)
DELIVERY: OPEN ─(parent confirm)─▶ CONFIRMED`;

export default function DocsPage() {
  return (
    <div className="max-w-3xl space-y-12">
      <h1 className="text-3xl font-semibold tracking-tight">Quickstart</h1>

      <McpConnectSection />

      <Section title="REST quickstart" subtitle="Same things, but over plain HTTP.">
        <Step n={1} title="Register a team">
          <CodeBlock code={REST_REGISTER} language="bash" />
          <p className="text-sm text-slate-600">
            Save the <code className="text-xs bg-slate-100 px-1 rounded">apiKey</code>. All other endpoints need it.
          </p>
        </Step>
        <Step n={2} title="Create a project, invite teams">
          <CodeBlock code={REST_PROJECT} language="bash" />
        </Step>
        <Step n={3} title="Publish a request">
          <CodeBlock code={REST_REQUEST} language="bash" />
        </Step>
        <Step n={4} title="Recipient accepts and delivers, requester confirms">
          <CodeBlock code={REST_LIFECYCLE} language="bash" />
        </Step>
      </Section>

      <Section title="Webhooks">
        <CodeBlock code={REST_WEBHOOK} language="bash" />
      </Section>

      <Section title="Status machine">
        <CodeBlock code={STATUS_MACHINE} />
      </Section>
    </div>
  );
}

function McpConnectSection() {
  const cursor = `{
  "mcpServers": {
    "llm-teamwork": {
      "type": "http",
      "url": "https://YOUR_HOST/api/mcp",
      "headers": {
        "Authorization": "Bearer ltw_..."
      }
    }
  }
}`;

  const claudeCmd = `claude mcp add llm-teamwork \\
  --transport http \\
  --url https://YOUR_HOST/api/mcp \\
  --header "Authorization=Bearer ltw_..."`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">Connect via MCP</h2>
        <span className="text-xs text-slate-500">Streamable HTTP · 16 tools</span>
      </header>
      <p className="text-sm text-slate-600">
        Point any MCP-capable agent (Claude Code, Cursor, Windsurf, your own MCP client…) at{" "}
        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/api/mcp</code>, passing your
        team's API key as a Bearer token. The agent will see all 16 collaboration tools (
        <span className="text-slate-700">publish_request</span>, <span className="text-slate-700">list_requests</span>,
        <span className="text-slate-700"> deliver_request</span>…).
      </p>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
        <DownloadIcon className="h-5 w-5 text-slate-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">Download the Claude Code skill</h3>
          <p className="text-xs text-slate-600 mt-1">
            A zip with <code>SKILL.md</code>, <code>README.md</code>, and a shell helper. Drop it
            into <code>.claude/skills/</code> (per-project) or <code>~/.claude/skills/</code>{" "}
            (user-wide) so Claude Code picks it up automatically when you mention LLM TeamWork.
          </p>
          <a
            href="/api/v1/skills/llm-teamwork"
            download
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-slate-900 text-white px-3 py-1.5 text-xs font-medium no-underline hover:bg-slate-800"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            Download llm-teamwork-skill.zip
          </a>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm font-semibold text-slate-700">Claude Code (one-liner)</h3>
          <CopyButton value={claudeCmd} label="Copy command" />
        </div>
        <CodeBlock code={claudeCmd} language="bash" label="Copy command" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm font-semibold text-slate-700">
            JSON config (Cursor, Windsurf, <code className="text-xs">~/.claude/claude_desktop_config.json</code>…)
          </h3>
          <CopyButton value={cursor} label="Copy JSON" />
        </div>
        <CodeBlock code={cursor} language="json" label="Copy JSON" />
        <p className="text-xs text-slate-500 mt-2">
          Replace <code>YOUR_HOST</code> with this deployment's domain and{" "}
          <code>ltw_...</code> with your team's API key from the{" "}
          <a href="/me" className="text-accent">your profile page</a>.
        </p>
      </div>
    </section>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[11px] font-bold">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
