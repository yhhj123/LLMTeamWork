import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { LoginForm } from "./form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/projects");

  const { t } = getT();
  const alt = t("auth.login.alt");
  const [before, after] = alt.split("{signup}");

  return (
    <div className="mx-auto max-w-md space-y-6 mt-8">
      <header>
        <h1 className="text-2xl font-semibold">{t("auth.login.title")}</h1>
        <p className="text-sm text-slate-600 mt-1">
          {before}
          <Link href="/signup">{t("auth.login.signup_link")}</Link>
          {after}
        </p>
      </header>
      <LoginForm
        labels={{
          email: t("auth.login.email"),
          password: t("auth.login.password"),
          submit: t("auth.login.submit"),
          submitting: t("auth.login.submitting"),
        }}
      />
    </div>
  );
}
