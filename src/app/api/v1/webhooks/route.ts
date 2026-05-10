import type { NextRequest } from "next/server";
import { withErrors, parseBody, ok, created } from "@/lib/http";
import { authenticateTeam } from "@/lib/auth";
import { WebhookCreate } from "@/lib/schemas";
import { createWebhook, listWebhooks } from "@/lib/services";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    return ok({ webhooks: await listWebhooks(team!.id) });
  });
}

export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    const body = await parseBody(req, WebhookCreate);
    return created(await createWebhook(team!.id, body));
  });
}
