// Transform "@team-slug" mentions inside a markdown body into bracketed links
// pointing at the team page, so React-Markdown renders them as anchors.
//
// Skipped contexts (to avoid mangling code samples):
//   - fenced code blocks (```...```)
//   - inline code (`...`)
// Mentions must be word-bounded: "@backend" matches but "foo@backend.com"
// does not because the preceding char is part of \w.

type MentionableTeam = { id: string; slug: string; name: string };

export function injectTeamMentions(body: string, teams: MentionableTeam[]): string {
  if (!body || teams.length === 0) return body;

  // Longest slug first so e.g. "backend-squad" matches before "backend".
  const sorted = [...teams].sort((a, b) => b.slug.length - a.slug.length);

  // 1. Split out fenced code blocks (odd indices = code).
  const fenced = body.split(/(```[\s\S]*?```)/g);
  return fenced
    .map((part, i) => {
      if (i % 2 === 1) return part;
      // 2. Split out inline code (odd indices = code).
      const inline = part.split(/(`[^`]*`)/g);
      return inline
        .map((p, j) => {
          if (j % 2 === 1) return p;
          let out = p;
          for (const t of sorted) {
            const re = new RegExp(`(^|[^\\w-])@${escapeRegex(t.slug)}\\b`, "g");
            out = out.replace(re, (_m, before) => `${before}[@${t.name}](/teams/${t.id})`);
          }
          return out;
        })
        .join("");
    })
    .join("");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
