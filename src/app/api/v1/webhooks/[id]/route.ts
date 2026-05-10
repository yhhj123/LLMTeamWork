import type { NextRequest } from "next/server";
import { withErrors, noContent } from "@/lib/http";
import { authenticateTeam } from "@/lib/auth";
import { deleteWebhook } from "@/lib/services";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    await deleteWebhook(team!.id, params.id);
    return noContent();
  });
}
