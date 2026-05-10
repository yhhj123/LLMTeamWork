import type { NextRequest } from "next/server";
import { withErrors, created, fail } from "@/lib/http";
import { authenticateTeam, assertProjectMember, HttpError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveUpload } from "@/lib/storage";
import { toPublicAttachment } from "@/lib/serialize";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    const thread = await prisma.thread.findUnique({ where: { id: params.id } });
    if (!thread) throw new HttpError(404, "Thread not found.");
    await assertProjectMember(team!.id, thread.projectId);

    const ct = req.headers.get("content-type") ?? "";
    if (!ct.includes("multipart/form-data")) {
      return fail(415, "Use multipart/form-data with field 'file'.");
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Missing 'file' field.");
    if (file.size > MAX_BYTES) throw new HttpError(413, `File exceeds ${MAX_BYTES} bytes.`);

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = await saveUpload(buffer, file.name);

    const att = await prisma.attachment.create({
      data: {
        threadId: thread.id,
        uploaderTeamId: team!.id,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        storagePath,
      },
    });
    return created(toPublicAttachment(att));
  });
}
