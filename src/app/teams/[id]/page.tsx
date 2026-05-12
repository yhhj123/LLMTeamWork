import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Markdown } from "@/components/Markdown";
import { getT } from "@/lib/i18n";
import { EditTeamForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const { t } = getT();

  const membership = user.teams.find(t => t.id === params.id);
  if (!membership) {
    redirect("/teams");
  }

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: true }, orderBy: { createdAt: "asc" } },
      _count: { select: { memberships: true, threadsSent: true, threadsRecv: true } },
    },
  });
  if (!team) notFound();

  const canEdit = membership.role === "owner" || membership.role === "admin";

  const slugNote = t("team.edit.slug_note");
  const slugParts = slugNote.split("{slug}");
  const linkParts = slugParts[1]?.split("{link}") ?? ["", ""];

  return (
    <div className="max-w-3xl space-y-8">
      <nav className="text-sm text-slate-500">
        <Link href="/teams">{t("team.crumb")}</Link>
        <span className="mx-1.5 text-slate-300">/</span>
        <span>{team.name}</span>
      </nav>

      <header className="rounded-xl bg-white border border-slate-200 p-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{team.name}</h1>
            <div className="text-xs text-slate-500 mt-1">
              slug: <code>{team.slug}</code> · id: <code>{team.id}</code>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs">
            {t("team.you_are")} <strong>{membership.role}</strong>
          </span>
        </div>
        {team.description && (
          <div className="pt-2 border-t border-slate-100">
            <Markdown>{team.description}</Markdown>
          </div>
        )}
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-2">{t("team.section.members")}</h2>
        <ul className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100">
          {team.members.map(m => (
            <li key={m.id} className="p-3 flex items-center justify-between text-sm">
              <div>
                <div className="font-medium text-slate-800">{m.user.displayName}</div>
                <div className="text-xs text-slate-500">{m.user.email}</div>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{m.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">{t("team.section.edit")}</h2>
        {canEdit ? (
          <EditTeamForm
            teamId={team.id}
            initialName={team.name}
            initialDescription={team.description ?? ""}
            labels={{
              name: t("team.edit.name"),
              desc: t("team.edit.desc"),
              desc_hint: t("team.edit.desc_hint"),
              submit: t("team.edit.submit"),
              submitting: t("team.edit.submitting"),
              saved: t("team.edit.saved"),
            }}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {t("team.edit.locked_role", { role: membership.role })}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-3">
          {slugParts[0]}
          <code>{team.slug}</code>
          {linkParts[0]}
          <Link href="/me">{t("team.edit.profile_link")}</Link>
          {linkParts[1]}
        </p>
      </section>
    </div>
  );
}
