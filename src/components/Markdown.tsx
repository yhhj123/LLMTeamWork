import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "./MermaidDiagram";

/**
 * GitHub-flavored markdown renderer with our typography defaults.
 *
 * Special handling:
 *  - Links open in a new tab.
 *  - Fenced code blocks tagged `mermaid` render as an SVG diagram via the
 *    client-only <MermaidDiagram> component. Source stays in the markdown so
 *    it round-trips on edit.
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
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          code: ({ className: cls, children, ...rest }) => {
            const match = /language-(\w+)/.exec(cls ?? "");
            const lang = match?.[1];
            const text = String(children).replace(/\n$/, "");
            if (lang === "mermaid") {
              return <MermaidDiagram chart={text} />;
            }
            return (
              <code className={cls} {...(rest as any)}>
                {children}
              </code>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
