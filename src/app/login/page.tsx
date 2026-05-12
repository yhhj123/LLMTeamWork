import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/projects");

  return (
    <div className="mx-auto max-w-md space-y-6 mt-8">
      <header>
        <h1 className="text-2xl font-semibold">Log in</h1>
        <p className="text-sm text-slate-600 mt-1">
          Or <Link href="/signup">create an account</Link> to register a new team.
        </p>
      </header>
      <LoginForm />
    </div>
  );
}
