import type { NextRequest } from "next/server";
import { withErrors, parseBody, ok, created } from "@/lib/http";
import { authenticateTeam, assertProjectMember } from "@/lib/auth";
import { InviteTeam } from "@/lib/schemas";
import { inviteTeamToProject, listProjectMembers } from "@/lib/services";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    await assertProjectMember(team!.id, params.id);
    return ok({ teams: await listProjectMembers(params.id) });
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    const body = await parseBody(req, InviteTeam);
    const m = await inviteTeamToProject(team!.id, params.id, body.team);
    return created(m);
  });
}
