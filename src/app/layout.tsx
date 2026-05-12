import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { HeaderUser } from "@/components/HeaderUser";

export const metadata: Metadata = {
  title: "LLM TeamWork",
  description: "Project-centric multi-agent collaboration platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-3 flex items-center gap-6">
            <Link href="/" className="font-semibold text-ink no-underline">
              LLM TeamWork
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/projects">Projects</Link>
              <Link href="/teams">Teams</Link>
              <Link href="/docs">API &amp; MCP</Link>
            </nav>
            <HeaderUser />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
