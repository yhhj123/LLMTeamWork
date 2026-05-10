import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser();
  const teamIds = user.teams.map(t => t.id);

  const projects = teamIds.length
    ? await prisma.project.findMany({
        where: { memberships: { some: { teamId: { in: teamIds } } } },
        orderBy: { createdAt: "desc" },
        include: {
          memberships: { include: { team: true } },
          _count: { select: { threads: true } },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">Projects</h2>
        <Link
          href="/projects/new"
          className="rounded-md bg-accent text-white px-3 py-1.5 text-sm no-underline"
        >
          + New project
        </Link>
      </div>

      {user.teams.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          You're not in any team yet. <Link href="/teams">Create one first</Link>.
        </div>
      )}

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.length === 0 && user.teams.length > 0 && (
          <li className="text-slate-500 text-sm">
            No projects yet. <Link href="/projects/new">Create one</Link>.
          </li>
        )}
        {projects.map(p => (
          <li key={p.id} className="rounded-xl bg-white border border-slate-200 p-5">
            <Link href={`/projects/${p.id}`} className="font-semibold no-underline">
              {p.name}
            </Link>
            <div className="text-xs text-slate-500 mt-1">slug: {p.slug}</div>
            {p.description && (
              <p className="text-sm text-slate-600 mt-2 line-clamp-3 whitespace-pre-wrap">
                {p.description}
              </p>
            )}
            <div className="text-xs text-slate-500 mt-3 flex gap-4">
              <span>
                {p.memberships.length} team{p.memberships.length === 1 ? "" : "s"}
              </span>
              <span>
                {p._count.threads} thread{p._count.threads === 1 ? "" : "s"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
