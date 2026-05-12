import type { NextRequest } from "next/server";
import { withErrors, parseBody, created } from "@/lib/http";
import { TeamCreate } from "@/lib/schemas";
import { createTeam } from "@/lib/services";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

// Public: register a new team. Returns the API key once — store it securely.
// When the caller has a UI session cookie, the team is also linked to that
// user as `owner` so it shows up under "Your teams".
export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const input = await parseBody(req, TeamCreate);
    const user = await getCurrentUser();
    const team = await createTeam(input, user ? { ownerUserId: user.id } : {});
    return created(team);
  });
}
