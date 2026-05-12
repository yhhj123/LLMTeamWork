import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Markdown } from "@/components/Markdown";
import { injectTeamMentions } from "@/lib/mentions";
import { getT } from "@/lib/i18n";
import { InviteTeamForm } from "./invite-form";
import { ArchitectureSection } from "./architecture-section";
import { ScopeEditor } from "./scope-form";

export const dynamic = "force-dynamic";

const STATUS_COLUMNS = ["OPEN", "ACCEPTED", "DELIVERED", "CONFIRMED"] as const;

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { t } = getT();

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

  const userTeamIds = new Set(user.teams.map(t => t.id));
  const memberTeamIds = new Set(project.memberships.map(m => m.teamId));
  const userHasMemberTeam = [...userTeamIds].some(id => memberTeamIds.has(id));
  const userIsOwner = project.memberships.some(
    m => m.role === "owner" && userTeamIds.has(m.teamId)
  );

  const projectTeams = project.memberships.map(m => m.team);
  const renderedArch = project.architecture
    ? injectTeamMentions(project.architecture, projectTeams)
    : "";

  const grouped: Record<string, typeof project.threads> = {};
  for (const status of STATUS_COLUMNS) grouped[status] = [];
  for (const th of project.threads) {
    if (grouped[th.status]) grouped[th.status].push(th);
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

      <ArchitectureSection
        projectId={project.id}
        canEdit={userIsOwner}
        rawSource={project.architecture ?? ""}
        labels={{
          heading: t("project.architecture"),
          edit: t("project.architecture.edit"),
          add: t("project.architecture.add"),
          save: t("project.architecture.save"),
          saving: t("project.architecture.saving"),
          cancel: t("project.architecture.cancel"),
          editor_hint: t("project.architecture.editor_hint"),
        }}
      >
        {project.architecture ? (
          <div className="rounded-xl bg-white border border-slate-200 p-5">
            <Markdown>{renderedArch}</Markdown>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
            {userIsOwner
              ? t("project.architecture.empty.owner")
              : t("project.architecture.empty.member")}
          </div>
        )}
      </ArchitectureSection>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-semibold">
            {t("project.teams_count", { n: project.memberships.length })}
          </h2>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {project.memberships.map(m => {
            const isMyTeam = userTeamIds.has(m.team.id);
            const canEditScope = isMyTeam || userIsOwner;
            return (
              <li
                key={m.id}
                className="rounded-xl bg-white border border-slate-200 p-3 space-y-2"
                title={`slug: ${m.team.slug}`}
              >
                <div className="flex items-center justify-between gap-2">
                  {isMyTeam ? (
                    <Link
                      href={`/teams/${m.team.id}`}
                      className="font-medium text-sm text-slate-800 no-underline hover:text-accent"
                    >
                      {m.team.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-sm text-slate-800">{m.team.name}</span>
                  )}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{m.role}</span>
                </div>
                {canEditScope ? (
                  <ScopeEditor
                    projectId={project.id}
                    teamId={m.team.id}
                    initialScope={m.scope ?? ""}
                    labels={{
                      placeholder: t("project.scope.placeholder"),
                      editor_placeholder: t("project.scope.editor_placeholder"),
                      save: t("project.scope.save"),
                      saving: t("project.scope.saving"),
                      cancel: t("project.scope.cancel"),
                    }}
                  />
                ) : (
                  <div className="text-xs text-slate-600">
                    {m.scope || <em className="text-slate-400">{t("project.scope.none")}</em>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {userHasMemberTeam ? (
          <div className="mt-4">
            <details className="rounded-xl bg-white border border-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">
                {t("project.invite.summary")}
              </summary>
              <div className="mt-3">
                <InviteTeamForm
                  projectId={project.id}
                  labels={{
                    label: t("project.invite.label"),
                    placeholder: t("project.invite.placeholder"),
                    hint: t("project.invite.hint"),
                    submit: t("project.invite.submit"),
                    submitting: t("project.invite.submitting"),
                    invited: t("project.invite.invited"),
                  }}
                />
              </div>
            </details>
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-3">{t("project.invite.no_member")}</p>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-3">{t("project.board.title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map(status => (
            <div key={status} className="rounded-xl bg-slate-100 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                {status} ({grouped[status].length})
              </div>
              <ul className="space-y-2">
                {grouped[status].map(thread => (
                  <li
                    key={thread.id}
                    className="rounded-lg bg-white border border-slate-200 p-3 hover:border-slate-300 transition-colors"
                  >
                    <Link
                      href={`/threads/${thread.id}`}
                      className="block text-sm font-medium text-slate-800 hover:text-accent no-underline leading-snug line-clamp-3"
                    >
                      {thread.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-1.5 truncate">
                      {thread.fromTeam.name} → {thread.toTeam.name}
                    </div>
                  </li>
                ))}
                {grouped[status].length === 0 && (
                  <li className="text-xs text-slate-400">{t("project.board.empty")}</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
