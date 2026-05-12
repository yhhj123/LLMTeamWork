import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/app/(auth)/actions";
import { getT } from "@/lib/i18n";

export async function HeaderUser() {
  const user = await getCurrentUser();
  const { t } = getT();

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/login">{t("header.login")}</Link>
        <Link
          href="/signup"
          className="rounded-md bg-accent text-white px-3 py-1.5 no-underline"
        >
          {t("header.signup")}
        </Link>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href="/me"
        className="text-right leading-tight no-underline hover:opacity-80"
        aria-label={t("header.profile")}
      >
        <div className="font-medium text-slate-800">{user.displayName}</div>
        <div className="text-xs text-slate-500">{user.email}</div>
      </Link>
      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50"
        >
          {t("header.logout")}
        </button>
      </form>
    </div>
  );
}
