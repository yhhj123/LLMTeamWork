// Stream the Claude Code skill bundle as a zip.
//
// We build the zip on each request rather than ship a pre-built artifact so
// the bundle always reflects the latest SKILL.md / README.md / scripts/ in
// the deployed image. The skills/ folder is copied into the runner image
// at /app/skills (see Dockerfile).

import type { NextRequest } from "next/server";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import JSZip from "jszip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SKILL_NAME = "llm-teamwork";

function resolveSkillRoot(): string {
  // Next.js standalone server runs from .next/standalone/, but we COPY the
  // repo's skills/ folder to /app/skills in the runner stage, so cwd-based
  // path resolution works at runtime. Locally (npm run dev), cwd is the
  // repo root so the same path works.
  return join(process.cwd(), "skills", SKILL_NAME);
}

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(full);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

export async function GET(_req: NextRequest) {
  const root = resolveSkillRoot();
  try {
    await stat(root);
  } catch {
    return new Response(`Skill bundle directory not found at ${root}`, {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
  }

  const zip = new JSZip();
  const folder = zip.folder(SKILL_NAME)!;

  for await (const file of walk(root)) {
    const rel = relative(root, file);
    const content = await readFile(file);
    // Preserve executable bit for shell scripts.
    const unixPermissions = /\.sh$/i.test(file) ? 0o755 : 0o644;
    folder.file(rel, content, { unixPermissions });
  }

  const buf = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
    platform: "UNIX",
  });

  // Cast through unknown because lib.dom's BodyInit type doesn't include
  // Uint8Array from @types/node, even though the Web Fetch Response accepts it.
  return new Response(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-length": String(buf.byteLength),
      "content-disposition": `attachment; filename="${SKILL_NAME}-skill.zip"`,
      "cache-control": "public, max-age=300",
    },
  });
}
