import type { NextRequest } from "next/server";
import { withErrors, ok } from "@/lib/http";
import { authenticateTeam } from "@/lib/auth";
import { cancelRequest } from "@/lib/services";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    return ok(await cancelRequest(team!.id, params.id));
  });
}
