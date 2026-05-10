import type { NextRequest } from "next/server";
import { withErrors, ok } from "@/lib/http";
import { authenticateTeam } from "@/lib/auth";
import { toPublicTeam } from "@/lib/serialize";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    return ok(toPublicTeam(team!));
  });
}
