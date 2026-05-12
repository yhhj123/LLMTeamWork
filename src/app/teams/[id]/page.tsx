import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Markdown } from "@/components/Markdown";
import { EditTeamForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const membership = user.teams.find(t => t.id === params.id);
  if (!membership) {
    // Not your team — bounce away. We don't expose foreign team detail pages.
    redirect("/teams");
  }

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: true }, orderBy: { createdAt: "asc" } },
      _count: { select: { memberships: true, threadsSent: true, threadsRecv: true } },
    },
  });
  if (!team) notFound();

  const canEdit = membership.role === "owner" || membership.role === "admin";

  return (
    <div className="max-w-3xl space-y-8">
      <nav className="text-sm text-slate-500">
        <Link href="/teams">Teams</Link>
        <span className="mx-1.5 text-slate-300">/</span>
        <span>{team.name}</span>
      </nav>

      <header className="rounded-xl bg-white border border-slate-200 p-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{team.name}</h1>
            <div className="text-xs text-slate-500 mt-1">
              slug: <code>{team.slug}</code> · id: <code>{team.id}</code>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs">
            you are <strong>{membership.role}</strong>
          </span>
        </div>
        {team.description && (
          <div className="pt-2 border-t border-slate-100">
            <Markdown>{team.description}</Markdown>
          </div>
        )}
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-2">Members</h2>
        <ul className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100">
          {team.members.map(m => (
            <li key={m.id} className="p-3 flex items-center justify-between text-sm">
              <div>
                <div className="font-medium text-slate-800">{m.user.displayName}</div>
                <div className="text-xs text-slate-500">{m.user.email}</div>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{m.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Edit team info</h2>
        {canEdit ? (
          <EditTeamForm
            teamId={team.id}
            initialName={team.name}
            initialDescription={team.description ?? ""}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Only team owners and admins can edit team info. Your role is{" "}
            <strong>{membership.role}</strong>.
          </div>
        )}
        <p className="text-xs text-slate-500 mt-3">
          The slug (<code>{team.slug}</code>) is intentionally immutable — agents and webhook
          subscribers may reference it. To rotate the API key, use{" "}
          <Link href="/me">your profile page</Link>.
        </p>
      </section>
    </div>
  );
}
