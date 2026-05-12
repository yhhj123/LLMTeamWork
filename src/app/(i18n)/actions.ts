"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

const ALLOWED: Locale[] = ["en", "zh"];

export async function setLocaleAction(locale: string) {
  if (!ALLOWED.includes(locale as Locale)) return;
  cookies().set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  // Re-render the layout so the new language appears immediately.
  revalidatePath("/");
}
