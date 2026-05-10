import type { Thread, Comment, Attachment, Project, Team, Webhook } from "@prisma/client";

export type PublicTeam = ReturnType<typeof toPublicTeam>;
export type PublicProject = ReturnType<typeof toPublicProject>;
export type PublicThread = ReturnType<typeof toPublicThread>;
export type PublicComment = ReturnType<typeof toPublicComment>;
export type PublicAttachment = ReturnType<typeof toPublicAttachment>;

export function toPublicTeam(t: Team, includeKey = false) {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    createdAt: t.createdAt.toISOString(),
    ...(includeKey ? { apiKey: t.apiKey } : {}),
  };
}

export function toPublicProject(p: Project) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    createdAt: p.createdAt.toISOString(),
  };
}

export type PublicThreadDTO = {
  id: string;
  projectId: string;
  kind: "REQUEST" | "DELIVERY";
  status: string;
  title: string;
  body: string;
  parentId: string | null;
  metadata: unknown;
  fromTeam: { id: string; name?: string; slug?: string; description?: string | null; createdAt?: string };
  toTeam: { id: string; name?: string; slug?: string; description?: string | null; createdAt?: string };
  createdAt: string;
  updatedAt: string;
  deliveries?: PublicThreadDTO[];
  comments?: ReturnType<typeof toPublicComment>[];
  attachments?: ReturnType<typeof toPublicAttachment>[];
};

export function toPublicThread(
  t: Thread & {
    fromTeam?: Team | null;
    toTeam?: Team | null;
    comments?: Comment[];
    attachments?: Attachment[];
    deliveries?: (Thread & { fromTeam?: Team | null; toTeam?: Team | null; attachments?: Attachment[] })[];
  }
): PublicThreadDTO {
  return {
    id: t.id,
    projectId: t.projectId,
    kind: t.kind as "REQUEST" | "DELIVERY",
    status: t.status,
    title: t.title,
    body: t.body,
    parentId: t.parentId,
    metadata: t.metadata ? safeJson(t.metadata) : null,
    fromTeam: t.fromTeam ? toPublicTeam(t.fromTeam) : { id: t.fromTeamId },
    toTeam: t.toTeam ? toPublicTeam(t.toTeam) : { id: t.toTeamId },
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    deliveries: t.deliveries?.map(d => toPublicThread(d)),
    comments: t.comments?.map(toPublicComment),
    attachments: t.attachments?.map(toPublicAttachment),
  };
}

export function toPublicComment(c: Comment) {
  return {
    id: c.id,
    threadId: c.threadId,
    teamId: c.teamId,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
  };
}

export function toPublicAttachment(a: Attachment) {
  return {
    id: a.id,
    threadId: a.threadId,
    commentId: a.commentId,
    filename: a.filename,
    mimeType: a.mimeType,
    size: a.size,
    uploaderTeamId: a.uploaderTeamId,
    downloadUrl: `/api/v1/attachments/${a.id}/content`,
    createdAt: a.createdAt.toISOString(),
  };
}

export function toPublicWebhook(w: Webhook) {
  return {
    id: w.id,
    teamId: w.teamId,
    projectId: w.projectId,
    url: w.url,
    events: w.events.split(",").map(e => e.trim()).filter(Boolean),
    active: w.active,
    createdAt: w.createdAt.toISOString(),
  };
}

function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return s; }
}
