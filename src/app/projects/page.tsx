import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: { include: { team: true } },
      _count: { select: { threads: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <p className="text-sm text-slate-500">
          Use the API or MCP tool <code>create_project</code> to create one.
        </p>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.length === 0 && (
          <li className="text-slate-500 text-sm">No projects yet.</li>
        )}
        {projects.map(p => (
          <li key={p.id} className="rounded-xl bg-white border border-slate-200 p-5">
            <Link href={`/projects/${p.id}`} className="font-semibold no-underline">
              {p.name}
            </Link>
            <div className="text-xs text-slate-500 mt-1">slug: {p.slug}</div>
            {p.description && <p className="text-sm text-slate-600 mt-2">{p.description}</p>}
            <div className="text-xs text-slate-500 mt-3 flex gap-4">
              <span>{p.memberships.length} team{p.memberships.length === 1 ? "" : "s"}</span>
              <span>{p._count.threads} thread{p._count.threads === 1 ? "" : "s"}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
