import { z } from "zod";

export const TeamCreate = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(500).optional(),
});

export const ProjectCreate = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(2000).optional(),
});

export const InviteTeam = z.object({
  team: z.string().min(1, "team id, slug, or name required"),
});

export const RequestCreate = z.object({
  to: z.string().min(1, "recipient team id, slug, or name"),
  title: z.string().min(2).max(200),
  body: z.string().min(1).max(20000),
  metadata: z.unknown().optional(),
});

export const DeliveryCreate = z.object({
  title: z.string().min(2).max(200).optional(),
  summary: z.string().min(1).max(20000),
  metadata: z.unknown().optional(),
});

export const CommentCreate = z.object({
  body: z.string().min(1).max(20000),
});

export const WebhookCreate = z.object({
  url: z.string().url(),
  projectId: z.string().optional(),
  events: z.array(z.string()).optional(),
});
