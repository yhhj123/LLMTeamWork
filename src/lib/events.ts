import { createHmac } from "node:crypto";
import { prisma } from "./db";

export type EventName =
  | "request.created"
  | "request.accepted"
  | "request.rejected"
  | "request.cancelled"
  | "request.delivered"
  | "request.confirmed"
  | "delivery.created"
  | "delivery.confirmed"
  | "comment.created";

const TIMEOUT = Number(process.env.WEBHOOK_TIMEOUT_MS ?? 5000);

/**
 * Fire an event for a project. Resolves the set of webhook subscribers
 * (project-scoped or team-wide for member teams) and dispatches in the
 * background. Failures are logged in WebhookDelivery rows; callers don't wait.
 */
export async function emit(event: EventName, projectId: string, payload: unknown) {
  // Find member teams of this project; webhook subscribers must belong.
  const members = await prisma.membership.findMany({
    where: { projectId },
    select: { teamId: true },
  });
  const memberTeamIds = members.map(m => m.teamId);
  if (memberTeamIds.length === 0) return;

  const hooks = await prisma.webhook.findMany({
    where: {
      active: true,
      teamId: { in: memberTeamIds },
      OR: [{ projectId }, { projectId: null }],
    },
  });

  const matching = hooks.filter(h => {
    const events = h.events.split(",").map(s => s.trim());
    return events.includes("*") || events.includes(event);
  });

  // Fire-and-forget dispatch.
  for (const hook of matching) {
    void dispatch(hook.id, hook.url, hook.secret, event, payload);
  }
}

async function dispatch(
  webhookId: string,
  url: string,
  secret: string,
  event: EventName,
  payload: unknown
) {
  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  const signature = createHmac("sha256", secret).update(body).digest("hex");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  let status: number | null = null;
  let error: string | null = null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ltw-event": event,
        "x-ltw-signature": `sha256=${signature}`,
      },
      body,
      signal: controller.signal,
    });
    status = res.status;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  } finally {
    clearTimeout(timer);
  }

  await prisma.webhookDelivery.create({
    data: {
      webhookId,
      event,
      payload: body,
      status: status ?? undefined,
      error: error ?? undefined,
      attempts: 1,
    },
  });
}
