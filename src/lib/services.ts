import { prisma } from "./db";
import { HttpError, assertProjectMember } from "./auth";
import { generateApiKey, generateWebhookSecret, slugify } from "./ids";
import { emit, type EventName } from "./events";
import {
  toPublicProject,
  toPublicTeam,
  toPublicThread,
  toPublicComment,
  toPublicWebhook,
} from "./serialize";

// ----- Teams -----------------------------------------------------------------

export async function createTeam(
  input: { name: string; description?: string },
  options: { ownerUserId?: string } = {}
) {
  const slug = slugify(input.name);
  const existing = await prisma.team.findFirst({ where: { OR: [{ name: input.name }, { slug }] } });
  if (existing) throw new HttpError(409, "Team name or slug already taken.");
  const team = await prisma.team.create({
    data: {
      name: input.name,
      slug,
      apiKey: generateApiKey(),
      description: input.description,
      ...(options.ownerUserId
        ? { members: { create: { userId: options.ownerUserId, role: "owner" } } }
        : {}),
    },
  });
  return toPublicTeam(team, /* includeKey */ true);
}

export async function rotateTeamApiKey(teamId: string) {
  const team = await prisma.team.update({
    where: { id: teamId },
    data: { apiKey: generateApiKey() },
  });
  return toPublicTeam(team, true);
}

// ----- Projects --------------------------------------------------------------

export async function createProject(
  ownerTeamId: string,
  input: { name: string; description?: string }
) {
  const slug = slugify(input.name);
  const existing = await prisma.project.findUnique({ where: { slug } });
  if (existing) throw new HttpError(409, "Project slug already exists.");
  const project = await prisma.project.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      memberships: { create: { teamId: ownerTeamId, role: "owner" } },
    },
  });
  return toPublicProject(project);
}

export async function listProjectsForTeam(teamId: string) {
  const memberships = await prisma.membership.findMany({
    where: { teamId },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });
  return memberships.map(m => ({
    ...toPublicProject(m.project),
    role: m.role,
  }));
}

export async function getProject(projectId: string) {
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if (!p) throw new HttpError(404, "Project not found.");
  return toPublicProject(p);
}

export async function listProjectMembers(projectId: string) {
  const ms = await prisma.membership.findMany({
    where: { projectId },
    include: { team: true },
  });
  return ms.map(m => ({ ...toPublicTeam(m.team), role: m.role }));
}

export async function inviteTeamToProject(
  inviterTeamId: string,
  projectId: string,
  inviteeIdOrSlug: string
) {
  await assertProjectMember(inviterTeamId, projectId);
  const target = await prisma.team.findFirst({
    where: { OR: [{ id: inviteeIdOrSlug }, { slug: inviteeIdOrSlug }, { name: inviteeIdOrSlug }] },
  });
  if (!target) throw new HttpError(404, "Invited team not found.");
  const m = await prisma.membership.upsert({
    where: { teamId_projectId: { teamId: target.id, projectId } },
    update: {},
    create: { teamId: target.id, projectId, role: "member" },
  });
  return { ...toPublicTeam(target), role: m.role };
}

// ----- Threads (requests + deliveries) --------------------------------------

export async function publishRequest(
  fromTeamId: string,
  projectId: string,
  input: { toTeamSlugOrId: string; title: string; body: string; metadata?: unknown }
) {
  await assertProjectMember(fromTeamId, projectId);
  const toTeam = await prisma.team.findFirst({
    where: { OR: [{ id: input.toTeamSlugOrId }, { slug: input.toTeamSlugOrId }, { name: input.toTeamSlugOrId }] },
  });
  if (!toTeam) throw new HttpError(404, "Recipient team not found.");
  if (toTeam.id === fromTeamId) throw new HttpError(400, "Cannot send a request to your own team.");
  await assertProjectMember(toTeam.id, projectId);

  const thread = await prisma.thread.create({
    data: {
      projectId,
      fromTeamId,
      toTeamId: toTeam.id,
      kind: "REQUEST",
      title: input.title,
      body: input.body,
      status: "OPEN",
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
    include: { fromTeam: true, toTeam: true },
  });
  const dto = toPublicThread(thread);
  await emit("request.created", projectId, dto);
  return dto;
}

export async function listThreads(
  callerTeamId: string,
  projectId: string,
  filter: { box?: "inbox" | "outbox" | "all"; status?: string; kind?: "REQUEST" | "DELIVERY" } = {}
) {
  await assertProjectMember(callerTeamId, projectId);
  const where: Record<string, unknown> = { projectId };
  if (filter.box === "inbox") where.toTeamId = callerTeamId;
  else if (filter.box === "outbox") where.fromTeamId = callerTeamId;
  else where.OR = [{ toTeamId: callerTeamId }, { fromTeamId: callerTeamId }];
  if (filter.status) where.status = filter.status;
  if (filter.kind) where.kind = filter.kind;

  const threads = await prisma.thread.findMany({
    where,
    include: { fromTeam: true, toTeam: true },
    orderBy: { updatedAt: "desc" },
  });
  return threads.map(t => toPublicThread(t));
}

export async function getThread(callerTeamId: string, threadId: string) {
  const t = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      fromTeam: true,
      toTeam: true,
      comments: { orderBy: { createdAt: "asc" } },
      attachments: true,
      deliveries: { include: { fromTeam: true, toTeam: true, attachments: true } },
    },
  });
  if (!t) throw new HttpError(404, "Thread not found.");
  await assertProjectMember(callerTeamId, t.projectId);
  return toPublicThread(t);
}

async function transitionRequest(
  callerTeamId: string,
  threadId: string,
  expected: string[],
  next: string,
  actor: "sender" | "recipient",
  event: EventName
) {
  const t = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!t) throw new HttpError(404, "Thread not found.");
  if (t.kind !== "REQUEST") throw new HttpError(400, "Operation only valid on REQUEST threads.");
  const allowedTeam = actor === "sender" ? t.fromTeamId : t.toTeamId;
  if (allowedTeam !== callerTeamId) {
    throw new HttpError(403, `Only the ${actor} team can perform this transition.`);
  }
  if (!expected.includes(t.status)) {
    throw new HttpError(409, `Cannot transition from status '${t.status}'. Expected one of: ${expected.join(", ")}`);
  }
  const updated = await prisma.thread.update({
    where: { id: threadId },
    data: { status: next },
    include: { fromTeam: true, toTeam: true },
  });
  const dto = toPublicThread(updated);
  await emit(event, t.projectId, dto);
  return dto;
}

export const acceptRequest = (callerTeamId: string, id: string) =>
  transitionRequest(callerTeamId, id, ["OPEN"], "ACCEPTED", "recipient", "request.accepted");

export const rejectRequest = (callerTeamId: string, id: string) =>
  transitionRequest(callerTeamId, id, ["OPEN", "ACCEPTED"], "REJECTED", "recipient", "request.rejected");

export const cancelRequest = (callerTeamId: string, id: string) =>
  transitionRequest(callerTeamId, id, ["OPEN", "ACCEPTED"], "CANCELLED", "sender", "request.cancelled");

export async function deliverRequest(
  callerTeamId: string,
  requestId: string,
  input: { title?: string; summary: string; metadata?: unknown }
) {
  const parent = await prisma.thread.findUnique({ where: { id: requestId } });
  if (!parent) throw new HttpError(404, "Request not found.");
  if (parent.kind !== "REQUEST") throw new HttpError(400, "Can only deliver against a REQUEST thread.");
  if (parent.toTeamId !== callerTeamId) throw new HttpError(403, "Only the recipient team can deliver.");
  if (!["OPEN", "ACCEPTED"].includes(parent.status)) {
    throw new HttpError(409, `Cannot deliver against a request in status '${parent.status}'.`);
  }

  const result = await prisma.$transaction(async tx => {
    const delivery = await tx.thread.create({
      data: {
        projectId: parent.projectId,
        fromTeamId: parent.toTeamId,
        toTeamId: parent.fromTeamId,
        kind: "DELIVERY",
        parentId: parent.id,
        title: input.title ?? `Delivery: ${parent.title}`,
        body: input.summary,
        status: "OPEN",
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
      include: { fromTeam: true, toTeam: true },
    });
    const updatedParent = await tx.thread.update({
      where: { id: parent.id },
      data: { status: "DELIVERED" },
      include: { fromTeam: true, toTeam: true },
    });
    return { delivery, updatedParent };
  });

  const deliveryDto = toPublicThread(result.delivery);
  const parentDto = toPublicThread(result.updatedParent);
  await emit("delivery.created", parent.projectId, deliveryDto);
  await emit("request.delivered", parent.projectId, parentDto);
  return { delivery: deliveryDto, request: parentDto };
}

export async function confirmRequest(callerTeamId: string, requestId: string) {
  const parent = await prisma.thread.findUnique({ where: { id: requestId } });
  if (!parent) throw new HttpError(404, "Request not found.");
  if (parent.kind !== "REQUEST") throw new HttpError(400, "Only REQUEST threads can be confirmed.");
  if (parent.fromTeamId !== callerTeamId) throw new HttpError(403, "Only the requesting team can confirm completion.");
  if (parent.status !== "DELIVERED") throw new HttpError(409, `Cannot confirm a request in status '${parent.status}'.`);

  const result = await prisma.$transaction(async tx => {
    const req = await tx.thread.update({
      where: { id: parent.id },
      data: { status: "CONFIRMED" },
      include: { fromTeam: true, toTeam: true },
    });
    const deliveries = await tx.thread.updateMany({
      where: { parentId: parent.id, kind: "DELIVERY", status: "OPEN" },
      data: { status: "CONFIRMED" },
    });
    return { req, deliveries: deliveries.count };
  });
  const dto = toPublicThread(result.req);
  await emit("request.confirmed", parent.projectId, dto);
  return dto;
}

// ----- Comments -------------------------------------------------------------

export async function addComment(callerTeamId: string, threadId: string, body: string) {
  const t = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!t) throw new HttpError(404, "Thread not found.");
  await assertProjectMember(callerTeamId, t.projectId);
  const comment = await prisma.comment.create({
    data: { threadId, teamId: callerTeamId, body },
  });
  const dto = toPublicComment(comment);
  await emit("comment.created", t.projectId, { threadId, comment: dto });
  return dto;
}

// ----- Webhooks -------------------------------------------------------------

export async function createWebhook(
  teamId: string,
  input: { url: string; projectId?: string; events?: string[] }
) {
  if (input.projectId) await assertProjectMember(teamId, input.projectId);
  const w = await prisma.webhook.create({
    data: {
      teamId,
      projectId: input.projectId ?? null,
      url: input.url,
      secret: generateWebhookSecret(),
      events: (input.events && input.events.length ? input.events : ["*"]).join(","),
    },
  });
  return { ...toPublicWebhook(w), secret: w.secret };
}

export async function listWebhooks(teamId: string) {
  const ws = await prisma.webhook.findMany({ where: { teamId }, orderBy: { createdAt: "desc" } });
  return ws.map(toPublicWebhook);
}

export async function deleteWebhook(teamId: string, webhookId: string) {
  const w = await prisma.webhook.findUnique({ where: { id: webhookId } });
  if (!w || w.teamId !== teamId) throw new HttpError(404, "Webhook not found.");
  await prisma.webhook.delete({ where: { id: webhookId } });
}
