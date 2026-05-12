"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders a Mermaid chart client-side. Imports the `mermaid` runtime
 * dynamically so it doesn't bloat the bundle of non-architecture pages.
 * Errors (syntax issues from agent-written charts) are surfaced inline
 * rather than crashing the page.
 */
export function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "strict",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        });
        const id = "mermaid-" + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, chart);
        if (cancelled) return;
        if (ref.current) ref.current.innerHTML = svg;
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
        <div className="font-semibold mb-1">Diagram failed to render</div>
        <pre className="whitespace-pre-wrap font-mono text-[11px]">{error}</pre>
        <details className="mt-2 cursor-pointer">
          <summary className="text-rose-800">Show source</summary>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-slate-700">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="my-3 overflow-x-auto rounded-lg bg-white border border-slate-200 p-4 [&_svg]:max-w-full [&_svg]:h-auto"
    />
  );
}
