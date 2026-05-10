import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const t = await prisma.thread.findUnique({
    where: { id: params.id },
    include: {
      project: true,
      fromTeam: true,
      toTeam: true,
      comments: { orderBy: { createdAt: "asc" }, include: { team: true } },
      attachments: true,
      deliveries: { include: { fromTeam: true, toTeam: true } },
      parent: true,
    },
  });
  if (!t) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <nav className="text-sm">
        <Link href={`/projects/${t.projectId}`}>{t.project.name}</Link>
        <span className="text-slate-400"> / </span>
        <span>{t.kind === "REQUEST" ? "Request" : "Delivery"}</span>
      </nav>

      <header className="rounded-xl bg-white border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <span className="rounded-full bg-slate-100 text-xs px-3 py-1">{t.status}</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {t.kind} · {t.fromTeam.name} → {t.toTeam.name} · {new Date(t.createdAt).toLocaleString()}
        </div>
        {t.parent && (
          <div className="text-xs text-slate-500 mt-1">
            Reply to: <Link href={`/threads/${t.parent.id}`}>{t.parent.title}</Link>
          </div>
        )}
        <article className="prose prose-sm mt-4 whitespace-pre-wrap text-slate-800">
          {t.body}
        </article>
        {t.attachments.length > 0 && (
          <ul className="mt-4 text-sm">
            <li className="font-semibold mb-1">Attachments</li>
            {t.attachments.map(a => (
              <li key={a.id}>
                <a href={`/api/v1/attachments/${a.id}/content`}>{a.filename}</a>{" "}
                <span className="text-xs text-slate-500">({a.size} bytes)</span>
              </li>
            ))}
          </ul>
        )}
      </header>

      {t.deliveries.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Deliveries</h2>
          <ul className="space-y-3">
            {t.deliveries.map(d => (
              <li key={d.id} className="rounded-xl bg-white border border-slate-200 p-4">
                <Link href={`/threads/${d.id}`} className="font-medium no-underline">
                  {d.title}
                </Link>
                <div className="text-xs text-slate-500 mt-1">
                  {d.fromTeam.name} → {d.toTeam.name} · status {d.status}
                </div>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{d.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-semibold mb-2">Comments</h2>
        <ul className="space-y-3">
          {t.comments.length === 0 && <li className="text-sm text-slate-500">No comments yet.</li>}
          {t.comments.map(c => (
            <li key={c.id} className="rounded-xl bg-white border border-slate-200 p-3">
              <div className="text-xs text-slate-500 mb-1">
                {c.team.name} · {new Date(c.createdAt).toLocaleString()}
              </div>
              <div className="text-sm whitespace-pre-wrap">{c.body}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
