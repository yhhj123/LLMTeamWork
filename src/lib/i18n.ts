// Lightweight i18n.
//
// We don't use Next.js `[locale]` segments — the platform's URLs are stable
// and shared across teams. Instead a cookie selects between `en` and `zh`,
// defaulting to whatever Accept-Language hints at on first visit, and server
// components read it via getCurrentLocale() / getT().
//
// Things we DON'T translate:
//   - User-generated content (team names, project descriptions, request bodies)
//   - Status identifiers (OPEN, ACCEPTED, DELIVERED, CONFIRMED, REJECTED, CANCELLED)
//   - MCP tool names, API paths, code snippets

import { cookies, headers } from "next/headers";

export type Locale = "en" | "zh";
export const LOCALE_COOKIE = "ltw_locale";
export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
];

export function getCurrentLocale(): Locale {
  const explicit = cookies().get(LOCALE_COOKIE)?.value;
  if (explicit === "en" || explicit === "zh") return explicit;
  // Fall back to Accept-Language header.
  const accept = headers().get("accept-language") ?? "";
  const first = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("zh")) return "zh";
  return "en";
}

type Dict = Record<string, string>;
type Dicts = Record<Locale, Dict>;

import { en } from "./i18n/en";
import { zh } from "./i18n/zh";

const dicts: Dicts = { en, zh };

/** Server-only helper. Returns a t() bound to the request's locale. */
export function getT() {
  const locale = getCurrentLocale();
  const dict = dicts[locale];
  function t(key: string, vars?: Record<string, string | number>): string {
    let s = dict[key] ?? dicts.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return s;
  }
  return { t, locale };
}
