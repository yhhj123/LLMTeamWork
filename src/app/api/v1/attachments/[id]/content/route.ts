import type { NextRequest } from "next/server";
import { withErrors, fail } from "@/lib/http";
import { authenticateTeam, assertProjectMember, HttpError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readUpload } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    const att = await prisma.attachment.findUnique({
      where: { id: params.id },
      include: { thread: true, comment: { include: { thread: true } } },
    });
    if (!att) throw new HttpError(404, "Attachment not found.");
    const projectId = att.thread?.projectId ?? att.comment?.thread.projectId;
    if (!projectId) return fail(404, "Attachment has no parent thread.");
    await assertProjectMember(team!.id, projectId);

    const { data } = await readUpload(att.storagePath);
    return new Response(data, {
      headers: {
        "content-type": att.mimeType,
        "content-length": String(att.size),
        "content-disposition": `attachment; filename="${encodeURIComponent(att.filename)}"`,
      },
    });
  });
}
