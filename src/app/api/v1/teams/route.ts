import type { NextRequest } from "next/server";
import { withErrors, parseBody, created } from "@/lib/http";
import { TeamCreate } from "@/lib/schemas";
import { createTeam } from "@/lib/services";

export const runtime = "nodejs";

// Public: register a new team. Returns the API key once — store it securely.
export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const input = await parseBody(req, TeamCreate);
    const team = await createTeam(input);
    return created(team);
  });
}
