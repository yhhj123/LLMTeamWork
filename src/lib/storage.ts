import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { randomBytes } from "node:crypto";

const ROOT = resolve(process.env.UPLOAD_DIR ?? "./uploads");

export async function saveUpload(buffer: Buffer, filename: string) {
  const id = randomBytes(12).toString("hex");
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const dir = join(ROOT, id.slice(0, 2));
  await mkdir(dir, { recursive: true });
  const storagePath = join(dir, `${id}_${safe}`);
  await writeFile(storagePath, buffer);
  // store path relative to ROOT for portability
  return storagePath.slice(ROOT.length + 1);
}

export async function readUpload(relPath: string) {
  const abs = resolve(ROOT, relPath);
  // Prevent path traversal: resolved path must stay under ROOT.
  if (!abs.startsWith(ROOT + sep) && abs !== ROOT) {
    throw new Error("Invalid storage path");
  }
  const [data, info] = await Promise.all([readFile(abs), stat(abs)]);
  return { data, size: info.size };
}
