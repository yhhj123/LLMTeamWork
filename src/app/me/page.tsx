import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { TeamKeyCard } from "./key-card";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await requireUser();
  const { t } = getT();

  const memberships = await prisma.teamMember.findMany({
    where: { userId: user.id },
    include: { team: true },
    orderBy: { createdAt: "asc" },
  });

  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  const noTeam = t("me.no_team");
  const [noTeamBefore, noTeamAfter] = noTeam.split("{link}");

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold">{t("me.title")}</h1>
        <p className="text-sm text-slate-600 mt-1">
          {t("me.account")} <span className="font-medium text-slate-800">{user.displayName}</span>{" "}
          <span className="text-slate-500">&lt;{user.email}&gt;</span>
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">{t("me.section.teams")}</h2>
          <Link href="/teams" className="text-sm">
            {t("me.create_another")}
          </Link>
        </div>
        <p className="text-sm text-slate-600">{t("me.intro")}</p>
        {memberships.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {noTeamBefore}
            <Link href="/teams">{t("me.no_team_link")}</Link>
            {noTeamAfter}
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
                  labels={{
                    settings: t("me.card.settings"),
                    api_key: t("me.card.api_key"),
                    reveal: t("me.card.reveal"),
                    hide: t("me.card.hide"),
                    copy: t("me.card.copy"),
                    rotate: t("me.card.rotate"),
                    rotating: t("me.card.rotating"),
                    rotate_confirm: t("me.card.rotate_confirm", { team: m.team.name }),
                    show_snippets: t("me.card.show_snippets"),
                    hide_snippets: t("me.card.hide_snippets"),
                    snippets_claude: t("me.snippets.claude"),
                    snippets_json: t("me.snippets.json"),
                    snippets_env: t("me.snippets.env"),
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
