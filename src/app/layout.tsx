import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { HeaderUser } from "@/components/HeaderUser";
import { LangSwitcher } from "@/components/LangSwitcher";
import { getT, LOCALES } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "LLM TeamWork",
  description: "Project-centric multi-agent collaboration platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = getT();
  return (
    <html lang={locale}>
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-3 flex items-center gap-6">
            <Link href="/" className="font-semibold text-ink no-underline">
              {t("nav.brand")}
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/projects">{t("nav.projects")}</Link>
              <Link href="/teams">{t("nav.teams")}</Link>
              <Link href="/docs">{t("nav.docs")}</Link>
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <LangSwitcher current={locale} options={LOCALES} />
              <HeaderUser />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
