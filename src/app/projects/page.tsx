import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser();
  const { t } = getT();
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

  const noTeam = t("projects.no_team_yet");
  const [noTeamBefore, noTeamAfter] = noTeam.split("{link}");
  const empty = t("projects.empty");
  const [emptyBefore, emptyAfter] = empty.split("{link}");

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{t("projects.title")}</h2>
        <Link
          href="/projects/new"
          className="rounded-md bg-accent text-white px-3 py-1.5 text-sm no-underline"
        >
          {t("projects.new")}
        </Link>
      </div>

      {user.teams.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {noTeamBefore}
          <Link href="/teams">{t("projects.no_team_yet_link")}</Link>
          {noTeamAfter}
        </div>
      )}

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.length === 0 && user.teams.length > 0 && (
          <li className="text-slate-500 text-sm">
            {emptyBefore}
            <Link href="/projects/new">{t("projects.empty_link")}</Link>
            {emptyAfter}
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
              <span>{t("projects.card.teams", { n: p.memberships.length })}</span>
              <span>{t("projects.card.threads", { n: p._count.threads })}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
