import type { NextRequest } from "next/server";
import { withErrors, parseBody, created } from "@/lib/http";
import { authenticateTeam } from "@/lib/auth";
import { CommentCreate } from "@/lib/schemas";
import { addComment } from "@/lib/services";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    const body = await parseBody(req, CommentCreate);
    return created(await addComment(team!.id, params.id, body.body));
  });
}
