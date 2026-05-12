import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Markdown } from "@/components/Markdown";
import { injectTeamMentions } from "@/lib/mentions";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-sky-100 text-sky-800 ring-sky-200",
  ACCEPTED: "bg-amber-100 text-amber-800 ring-amber-200",
  DELIVERED: "bg-violet-100 text-violet-800 ring-violet-200",
  CONFIRMED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 ring-rose-200",
  CANCELLED: "bg-slate-200 text-slate-700 ring-slate-300",
};

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const thread = await prisma.thread.findUnique({
    where: { id: params.id },
    include: {
      project: { include: { memberships: { include: { team: true } } } },
      fromTeam: true,
      toTeam: true,
      comments: { orderBy: { createdAt: "asc" }, include: { team: true } },
      attachments: true,
      deliveries: { include: { fromTeam: true, toTeam: true, attachments: true } },
      parent: true,
    },
  });
  if (!thread) notFound();
  const { t } = getT();

  const statusClass = STATUS_STYLE[thread.status] ?? STATUS_STYLE.OPEN;
  const projectTeams = thread.project.memberships.map(m => m.team);
  const md = (body: string) => injectTeamMentions(body, projectTeams);

  return (
    <div className="space-y-6 max-w-3xl">
      <nav className="text-sm text-slate-500">
        <Link href={`/projects/${thread.projectId}`}>{thread.project.name}</Link>
        <span className="mx-1.5 text-slate-300">/</span>
        <span>{thread.kind === "REQUEST" ? t("thread.crumb_request") : t("thread.crumb_delivery")}</span>
      </nav>

      <header className="rounded-xl bg-white border border-slate-200 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold leading-tight">{thread.title}</h1>
          <span className={`shrink-0 rounded-full text-xs font-medium px-2.5 py-1 ring-1 ${statusClass}`}>
            {thread.status}
          </span>
        </div>
        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">{thread.kind}</span>
          <span>{thread.fromTeam.name}</span>
          <Arrow />
          <span>{thread.toTeam.name}</span>
          <span>·</span>
          <time>{new Date(thread.createdAt).toLocaleString()}</time>
        </div>
        {thread.parent && (
          <div className="text-xs text-slate-500">
            {t("thread.reply_to")} <Link href={`/threads/${thread.parent.id}`}>{thread.parent.title}</Link>
          </div>
        )}
        <div className="pt-2 border-t border-slate-100">
          <Markdown>{md(thread.body)}</Markdown>
        </div>
        {thread.attachments.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {t("thread.attachments")}
            </div>
            <ul className="space-y-1 text-sm">
              {thread.attachments.map(a => (
                <li key={a.id} className="flex items-center gap-2">
                  <PaperclipIcon className="h-4 w-4 text-slate-400" />
                  <a href={`/api/v1/attachments/${a.id}/content`}>{a.filename}</a>
                  <span className="text-xs text-slate-500">({formatBytes(a.size)})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {thread.deliveries.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2 text-slate-700">{t("thread.deliveries")}</h2>
          <ul className="space-y-3">
            {thread.deliveries.map(d => {
              const dStatus = STATUS_STYLE[d.status] ?? STATUS_STYLE.OPEN;
              return (
                <li key={d.id} className="rounded-xl bg-white border border-slate-200 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <Link href={`/threads/${d.id}`} className="font-medium no-underline">
                      {d.title}
                    </Link>
                    <span className={`shrink-0 rounded-full text-xs font-medium px-2.5 py-1 ring-1 ${dStatus}`}>
                      {d.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    {d.fromTeam.name} <Arrow /> {d.toTeam.name}
                  </div>
                  <Markdown>{md(d.body)}</Markdown>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-semibold mb-2 text-slate-700">{t("thread.comments")}</h2>
        <ul className="space-y-3">
          {thread.comments.length === 0 && (
            <li className="text-sm text-slate-500 italic">{t("thread.no_comments")}</li>
          )}
          {thread.comments.map(c => (
            <li key={c.id} className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="font-medium text-slate-700">{c.team.name}</span>
                <span>·</span>
                <time>{new Date(c.createdAt).toLocaleString()}</time>
              </div>
              <Markdown>{md(c.body)}</Markdown>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Arrow() {
  return <span className="text-slate-400">→</span>;
}

function PaperclipIcon({ className }: { className?: string }) {
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
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
