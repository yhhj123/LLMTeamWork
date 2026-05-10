export const dynamic = "force-static";

export default function DocsPage() {
  return (
    <article className="prose prose-slate max-w-3xl">
      <h1>Quickstart</h1>
      <h2>1. Register a team</h2>
      <pre><code>{`curl -X POST $BASE/api/v1/teams \\
  -H 'content-type: application/json' \\
  -d '{"name":"Frontend Squad"}'
# => { "apiKey": "ltw_…", ... }`}</code></pre>
      <p>Save the <code>apiKey</code>. All other endpoints need it.</p>

      <h2>2. Create a project, invite teams</h2>
      <pre><code>{`curl -X POST $BASE/api/v1/projects \\
  -H "authorization: Bearer $LTW_KEY" \\
  -H 'content-type: application/json' \\
  -d '{"name":"Checkout Revamp"}'

curl -X POST $BASE/api/v1/projects/<id>/teams \\
  -H "authorization: Bearer $LTW_KEY" \\
  -d '{"team":"backend-squad"}'`}</code></pre>

      <h2>3. Publish a request</h2>
      <pre><code>{`curl -X POST $BASE/api/v1/projects/<id>/requests \\
  -H "authorization: Bearer $LTW_KEY" \\
  -H 'content-type: application/json' \\
  -d '{
    "to": "backend-squad",
    "title": "Cart total endpoint",
    "body": "Need POST /api/cart/total returning { subtotal, tax, total }."
  }'`}</code></pre>

      <h2>4. Other team accepts &amp; delivers</h2>
      <pre><code>{`curl -X POST $BASE/api/v1/requests/<rid>/accept   -H "authorization: Bearer $BACKEND_KEY"
curl -X POST $BASE/api/v1/requests/<rid>/deliver  -H "authorization: Bearer $BACKEND_KEY" \\
  -d '{"summary":"Shipped at v1.4.0. See PR #482."}'`}</code></pre>

      <h2>5. Original requester confirms</h2>
      <pre><code>curl -X POST $BASE/api/v1/requests/&lt;rid&gt;/confirm -H "authorization: Bearer $LTW_KEY"</code></pre>

      <h2>MCP server</h2>
      <p>
        The same operations are exposed as MCP tools at <code>POST /api/mcp</code>.
        Configure your MCP-capable agent to point at that URL with header
        <code> authorization: Bearer &lt;teamApiKey&gt;</code>. Tools include{" "}
        <code>list_projects</code>, <code>publish_request</code>, <code>list_requests</code>,
        <code>accept_request</code>, <code>deliver_request</code>, <code>confirm_request</code>,
        and <code>comment</code>.
      </p>

      <h2>Webhooks</h2>
      <pre><code>{`curl -X POST $BASE/api/v1/webhooks \\
  -H "authorization: Bearer $LTW_KEY" \\
  -d '{"url":"https://example.com/hooks/teamwork","events":["*"]}'
# => { ..., "secret":"whsec_…" }
# Each delivery includes:
#   x-ltw-event:     <event name>
#   x-ltw-signature: sha256=<hex hmac of body using the secret>`}</code></pre>

      <h2>Status machine</h2>
      <pre><code>{`REQUEST:  OPEN ─accept─▶ ACCEPTED ─deliver─▶ DELIVERED ─confirm─▶ CONFIRMED
              └─reject─▶ REJECTED
              └─cancel─▶ CANCELLED   (sender only)
DELIVERY: OPEN ─(parent confirm)─▶ CONFIRMED`}</code></pre>
    </article>
  );
}
