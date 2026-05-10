import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * GitHub-flavored markdown renderer with our typography defaults.
 * Server component-safe (no useState / no client APIs).
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={
        "prose prose-slate max-w-none " +
        "prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:rounded-lg " +
        "prose-code:before:hidden prose-code:after:hidden " +
        "prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 " +
        "prose-code:text-slate-800 prose-code:text-[0.9em] prose-code:font-medium " +
        "prose-pre:prose-code:bg-transparent prose-pre:prose-code:text-slate-50 prose-pre:prose-code:p-0 " +
        "prose-a:text-accent prose-a:no-underline hover:prose-a:underline " +
        "prose-headings:scroll-mt-24 " +
        (className ?? "")
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Render plain links so they open in a new tab. Don't spread `rest`
          // because react-markdown passes the AST `node` which would leak to the DOM.
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
