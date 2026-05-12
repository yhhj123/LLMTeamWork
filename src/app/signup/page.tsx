import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { SignupForm } from "./form";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/projects");

  const { t } = getT();
  const alt = t("auth.signup.alt");
  const [before, after] = alt.split("{login}");

  return (
    <div className="mx-auto max-w-md space-y-6 mt-8">
      <header>
        <h1 className="text-2xl font-semibold">{t("auth.signup.title")}</h1>
        <p className="text-sm text-slate-600 mt-1">
          {before}
          <Link href="/login">{t("auth.signup.login_link")}</Link>
          {after}
        </p>
      </header>
      <SignupForm
        labels={{
          email: t("auth.signup.email"),
          name: t("auth.signup.name"),
          password: t("auth.signup.password"),
          password_hint: t("auth.signup.password_hint"),
          team: t("auth.signup.team"),
          team_placeholder: t("auth.signup.team_placeholder"),
          team_hint: t("auth.signup.team_hint"),
          submit: t("auth.signup.submit"),
          submitting: t("auth.signup.submitting"),
        }}
      />
      <p className="text-xs text-slate-500">{t("auth.signup.footer")}</p>
    </div>
  );
}
