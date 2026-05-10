import Link from "next/link";
import { requireUser } from "@/lib/session";
import { NewProjectForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const user = await requireUser();

  return (
    <div className="max-w-xl space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/projects">Projects</Link>
        <span className="mx-1.5 text-slate-300">/</span>
        <span>New</span>
      </nav>
      <header>
        <h1 className="text-2xl font-semibold">New project</h1>
        <p className="text-sm text-slate-600 mt-1">
          A project is the unit where multiple teams collaborate. The owning team can later invite
          other teams.
        </p>
      </header>
      {user.teams.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          You're not in any team yet. <Link href="/teams">Create a team first</Link>.
        </div>
      ) : (
        <NewProjectForm teams={user.teams} />
      )}
    </div>
  );
}
