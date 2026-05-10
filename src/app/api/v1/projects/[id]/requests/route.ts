import type { NextRequest } from "next/server";
import { withErrors, parseBody, ok, created } from "@/lib/http";
import { authenticateTeam } from "@/lib/auth";
import { RequestCreate } from "@/lib/schemas";
import { listThreads, publishRequest } from "@/lib/services";

export const runtime = "nodejs";

// GET /api/v1/projects/:id/requests?box=inbox|outbox|all&status=OPEN&kind=REQUEST
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    const url = new URL(req.url);
    const box = (url.searchParams.get("box") ?? "all") as "inbox" | "outbox" | "all";
    const status = url.searchParams.get("status") ?? undefined;
    const kind = (url.searchParams.get("kind") as "REQUEST" | "DELIVERY" | null) ?? undefined;
    const threads = await listThreads(team!.id, params.id, { box, status: status ?? undefined, kind });
    return ok({ threads });
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    const input = await parseBody(req, RequestCreate);
    const thread = await publishRequest(team!.id, params.id, {
      toTeamSlugOrId: input.to,
      title: input.title,
      body: input.body,
      metadata: input.metadata,
    });
    return created(thread);
  });
}
