import { prisma } from "@/lib/db";
import { TeamRegisterForm } from "./form";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, description: true, createdAt: true },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <section>
        <h2 className="text-xl font-semibold mb-3">Register a new team</h2>
        <p className="text-sm text-slate-600 mb-4">
          A team is the smallest unit that owns an API key. Anyone — and any agent — that holds
          the key acts as that team. Save the key once, securely; you can rotate it later.
        </p>
        <TeamRegisterForm />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-3">Existing teams</h2>
        <ul className="divide-y divide-slate-200 rounded-xl bg-white border border-slate-200">
          {teams.length === 0 && <li className="p-4 text-slate-500 text-sm">No teams yet.</li>}
          {teams.map(t => (
            <li key={t.id} className="p-4">
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-slate-500">slug: {t.slug} · id: {t.id}</div>
              {t.description && <div className="text-sm text-slate-700 mt-1">{t.description}</div>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
