import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_COLUMNS = ["OPEN", "ACCEPTED", "DELIVERED", "CONFIRMED"] as const;

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      memberships: { include: { team: true } },
      threads: {
        where: { kind: "REQUEST" },
        orderBy: { updatedAt: "desc" },
        include: { fromTeam: true, toTeam: true },
      },
    },
  });
  if (!project) notFound();

  const grouped: Record<string, typeof project.threads> = {};
  for (const status of STATUS_COLUMNS) grouped[status] = [];
  for (const t of project.threads) {
    if (grouped[t.status]) grouped[t.status].push(t);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <div className="text-sm text-slate-500">id: {project.id} · slug: {project.slug}</div>
        {project.description && <p className="mt-2 text-slate-700">{project.description}</p>}
      </header>

      <section>
        <h2 className="font-semibold mb-2">Teams</h2>
        <ul className="flex flex-wrap gap-2">
          {project.memberships.map(m => (
            <li key={m.id} className="rounded-full bg-white border border-slate-200 px-3 py-1 text-sm">
              {m.team.name} <span className="text-slate-400 text-xs">({m.role})</span>
            </li>
          ))}
        </ul>
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
