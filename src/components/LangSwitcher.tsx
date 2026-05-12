"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/app/(i18n)/actions";
import type { Locale } from "@/lib/i18n";

export function LangSwitcher({
  current,
  options,
}: {
  current: Locale;
  options: { code: Locale; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <select
      aria-label="Language"
      value={current}
      onChange={onChange}
      disabled={pending}
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {options.map(o => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
