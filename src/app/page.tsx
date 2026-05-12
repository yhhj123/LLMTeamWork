import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const { t } = getT();

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-white border border-slate-200 p-8">
        <h1 className="text-3xl font-semibold mb-2">{t("landing.title")}</h1>
        <p className="text-slate-600 max-w-2xl">{t("landing.tagline")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {user ? (
            <>
              <Link
                href="/projects"
                className="px-4 py-2 rounded-lg bg-accent text-white no-underline"
              >
                {t("landing.cta.open_projects")}
              </Link>
              <Link
                href="/projects/new"
                className="px-4 py-2 rounded-lg bg-slate-100 no-underline"
              >
                {t("landing.cta.new_project")}
              </Link>
              <Link href="/docs" className="px-4 py-2 rounded-lg bg-slate-100 no-underline">
                {t("landing.cta.mcp_setup")}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg bg-accent text-white no-underline"
              >
                {t("header.signup")}
              </Link>
              <Link href="/login" className="px-4 py-2 rounded-lg bg-slate-100 no-underline">
                {t("header.login")}
              </Link>
              <Link href="/docs" className="px-4 py-2 rounded-lg bg-slate-100 no-underline">
                {t("landing.cta.quickstart")}
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title={t("landing.card1.title")} body={t("landing.card1.body")} />
        <Card title={t("landing.card2.title")} body={t("landing.card2.body")} />
        <Card title={t("landing.card3.title")} body={t("landing.card3.body")} />
      </section>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{body}</p>
    </div>
  );
}
