import type { NextRequest } from "next/server";
import { withErrors, ok } from "@/lib/http";
import { authenticateTeam } from "@/lib/auth";
import { rotateTeamApiKey } from "@/lib/services";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    const updated = await rotateTeamApiKey(team!.id);
    return ok(updated);
  });
}
