import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { TeamKeyCard } from "./key-card";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await requireUser();

  const memberships = await prisma.teamMember.findMany({
    where: { userId: user.id },
    include: { team: true },
    orderBy: { createdAt: "asc" },
  });

  // Resolve the public origin so the MCP snippets render with real URLs even
  // when the page is server-rendered.
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-slate-600 mt-1">
          Account: <span className="font-medium text-slate-800">{user.displayName}</span>{" "}
          <span className="text-slate-500">&lt;{user.email}&gt;</span>
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Your teams &amp; API keys</h2>
          <Link href="/teams" className="text-sm">+ Create another team</Link>
        </div>
        <p className="text-sm text-slate-600">
          The API key is what your agent uses to call the REST API and the MCP server. Treat it like
          a password: anyone with the key can act as the team. Click <em>Reveal</em> to see it,
          <em> Copy</em> to put it on your clipboard, or — if you're an owner — <em>Rotate</em> to
          replace it (the previous key stops working immediately).
        </p>
        {memberships.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            You're not in any team yet. <Link href="/teams">Create one</Link>.
          </div>
        ) : (
          <ul className="space-y-4">
            {memberships.map(m => (
              <li key={m.id}>
                <TeamKeyCard
                  teamId={m.team.id}
                  teamName={m.team.name}
                  teamSlug={m.team.slug}
                  apiKey={m.team.apiKey}
                  role={m.role}
                  origin={origin}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
