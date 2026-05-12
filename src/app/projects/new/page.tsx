import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { NewProjectForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const user = await requireUser();
  const { t } = getT();

  const noTeam = t("projects.new.no_team");
  const [noTeamBefore, noTeamAfter] = noTeam.split("{link}");

  return (
    <div className="max-w-xl space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/projects">{t("projects.new.crumb_root")}</Link>
        <span className="mx-1.5 text-slate-300">/</span>
        <span>{t("projects.new.crumb_self")}</span>
      </nav>
      <header>
        <h1 className="text-2xl font-semibold">{t("projects.new.title")}</h1>
        <p className="text-sm text-slate-600 mt-1">{t("projects.new.intro")}</p>
      </header>
      {user.teams.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {noTeamBefore}
          <Link href="/teams">{t("projects.new.no_team_link")}</Link>
          {noTeamAfter}
        </div>
      ) : (
        <NewProjectForm
          teams={user.teams}
          labels={{
            name: t("projects.new.name"),
            name_placeholder: t("projects.new.name_placeholder"),
            desc: t("projects.new.desc"),
            owner: t("projects.new.owner"),
            owner_hint: t("projects.new.owner_hint"),
            submit: t("projects.new.submit"),
            submitting: t("projects.new.submitting"),
          }}
        />
      )}
    </div>
  );
}
