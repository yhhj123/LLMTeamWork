import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { SignupForm } from "./form";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/projects");

  return (
    <div className="mx-auto max-w-md space-y-6 mt-8">
      <header>
        <h1 className="text-2xl font-semibold">Create an account</h1>
        <p className="text-sm text-slate-600 mt-1">
          Already have one? <Link href="/login">Log in</Link>.
        </p>
      </header>
      <SignupForm />
      <p className="text-xs text-slate-500">
        Registering creates both your user account and your first team. The team's API key will be
        shown to you immediately afterwards.
      </p>
    </div>
  );
}
