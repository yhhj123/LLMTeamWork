import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Markdown } from "@/components/Markdown";
import { InviteTeamForm } from "./invite-form";

export const dynamic = "force-dynamic";

const STATUS_COLUMNS = ["OPEN", "ACCEPTED", "DELIVERED", "CONFIRMED"] as const;

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      memberships: { include: { team: true }, orderBy: { createdAt: "asc" } },
      threads: {
        where: { kind: "REQUEST" },
        orderBy: { updatedAt: "desc" },
        include: { fromTeam: true, toTeam: true },
      },
    },
  });
  if (!project) notFound();

  // Gate the invite form on: the user belongs to at least one team that's
  // already a project member. That same team becomes the inviter on submit.
  const userTeamIds = new Set(user.teams.map(t => t.id));
  const memberTeamIds = new Set(project.memberships.map(m => m.teamId));
  const userHasMemberTeam = [...userTeamIds].some(id => memberTeamIds.has(id));

  const grouped: Record<string, typeof project.threads> = {};
  for (const status of STATUS_COLUMNS) grouped[status] = [];
  for (const t of project.threads) {
    if (grouped[t.status]) grouped[t.status].push(t);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <div className="text-sm text-slate-500">
          id: <code>{project.id}</code> · slug: <code>{project.slug}</code>
        </div>
        {project.description && (
          <div className="mt-3">
            <Markdown>{project.description}</Markdown>
          </div>
        )}
      </header>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-semibold">Teams ({project.memberships.length})</h2>
        </div>
        <ul className="flex flex-wrap gap-2">
          {project.memberships.map(m => (
            <li
              key={m.id}
              className="rounded-full bg-white border border-slate-200 px-3 py-1 text-sm"
              title={`slug: ${m.team.slug}`}
            >
              {userTeamIds.has(m.team.id) ? (
                <Link href={`/teams/${m.team.id}`} className="no-underline hover:text-accent">
                  {m.team.name}
                </Link>
              ) : (
                <span>{m.team.name}</span>
              )}{" "}
              <span className="text-slate-400 text-xs">({m.role})</span>
            </li>
          ))}
        </ul>

        {userHasMemberTeam ? (
          <div className="mt-4">
            <details className="rounded-xl bg-white border border-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">
                + Invite another team
              </summary>
              <div className="mt-3">
                <InviteTeamForm projectId={project.id} />
              </div>
            </details>
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-3">
            None of your teams are in this project, so you can't invite others. Ask a current
            member to invite you first.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-3">Requests board</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map(status => (
            <div key={status} className="rounded-xl bg-slate-100 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                {status} ({grouped[status].length})
              </div>
              <ul className="space-y-2">
                {grouped[status].map(t => (
                  <li key={t.id} className="rounded-lg bg-white border border-slate-200 p-3">
                    <Link href={`/threads/${t.id}`} className="font-medium no-underline">
                      {t.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-1">
                      {t.fromTeam.name} → {t.toTeam.name}
                    </div>
                  </li>
                ))}
                {grouped[status].length === 0 && (
                  <li className="text-xs text-slate-400">empty</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
