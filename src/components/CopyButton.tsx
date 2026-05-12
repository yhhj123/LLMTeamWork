"use client";

import { useState } from "react";

type Props = {
  value: string;
  label?: string;
  className?: string;
};

/** Copy-to-clipboard button with a transient "Copied!" state. */
export function CopyButton({ value, label = "Copy", className }: Props) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for ancient browsers / non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? "Copied" : label}
      className={
        "inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white " +
        "px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 " +
        "transition-colors disabled:opacity-50 " +
        (className ?? "")
      }
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
          Copied
        </>
      ) : (
        <>
          <ClipboardIcon className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </button>
  );
}

/** Code block with an absolutely-positioned copy button overlaid in the corner. */
export function CodeBlock({
  code,
  language,
  label,
}: {
  code: string;
  language?: string;
  label?: string;
}) {
  return (
    <div className="relative my-3 group">
      <pre className="rounded-lg bg-slate-900 text-slate-50 text-xs leading-relaxed p-4 pr-14 overflow-x-auto">
        <code className={language ? `language-${language}` : undefined}>{code}</code>
      </pre>
      <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <CopyButton value={code} label={label ?? "Copy"} />
      </div>
    </div>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
