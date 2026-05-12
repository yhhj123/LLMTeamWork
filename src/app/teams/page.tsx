import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { TeamRegisterForm } from "./form";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const user = await requireUser();

  const memberships = await prisma.teamMember.findMany({
    where: { userId: user.id },
    include: { team: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Your teams</h1>
        <p className="text-sm text-slate-600 mt-1">
          You belong to {memberships.length} team{memberships.length === 1 ? "" : "s"}. Each team
          owns an API key its agents use to call the platform.
        </p>
      </header>

      <section>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memberships.map(m => (
            <li key={m.id} className="rounded-xl bg-white border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/teams/${m.team.id}`}
                    className="font-semibold no-underline hover:text-accent"
                  >
                    {m.team.name}
                  </Link>
                  <div className="text-xs text-slate-500 mt-1">slug: {m.team.slug}</div>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{m.role}</span>
              </div>
              {m.team.description && (
                <p className="text-sm text-slate-600 mt-2 line-clamp-3 whitespace-pre-wrap">
                  {m.team.description}
                </p>
              )}
              <div className="text-xs text-slate-500 mt-3 flex items-center justify-between">
                <span>Joined {new Date(m.createdAt).toLocaleDateString()}</span>
                <Link href={`/teams/${m.team.id}`}>Settings →</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-slate-200 pt-8">
        <h2 className="text-lg font-semibold mb-2">Create another team</h2>
        <p className="text-sm text-slate-600 mb-4">
          Useful if you operate multiple groups (e.g. <em>Frontend</em>, <em>Backend</em>). After
          creating, the API key is shown once — copy it then.
        </p>
        <TeamRegisterForm />
      </section>
    </div>
  );
}
