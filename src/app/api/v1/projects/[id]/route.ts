import type { NextRequest } from "next/server";
import { withErrors, ok } from "@/lib/http";
import { authenticateTeam, assertProjectMember } from "@/lib/auth";
import { getProject } from "@/lib/services";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    await assertProjectMember(team!.id, params.id);
    return ok(await getProject(params.id));
  });
}
