// MCP tool definitions. These wrap the same service-layer functions used by REST,
// so REST and MCP share semantics, validation, and event emission.

import { z } from "zod";
import {
  createProject,
  listProjectsForTeam,
  getProject,
  inviteTeamToProject,
  listProjectMembers,
  publishRequest,
  listThreads,
  getThread,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  deliverRequest,
  confirmRequest,
  addComment,
} from "@/lib/services";

export type McpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  zodSchema: z.ZodTypeAny;
  handler: (teamId: string, args: unknown) => Promise<unknown>;
};

function tool<S extends z.ZodTypeAny>(
  name: string,
  description: string,
  schema: S,
  handler: (teamId: string, args: z.infer<S>) => Promise<unknown>
): McpTool {
  return {
    name,
    description,
    inputSchema: zodToJsonSchema(schema),
    zodSchema: schema,
    handler: (teamId, args) => handler(teamId, schema.parse(args ?? {})),
  };
}

// Minimal zod -> JSON Schema converter sufficient for MCP tool input descriptors.
// Handles the subset we actually use: object/string/number/boolean/array/optional/union/enum.
export function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const def: any = schema._def;
  switch (def.typeName) {
    case "ZodString":
      return { type: "string", ...(def.description ? { description: def.description } : {}) };
    case "ZodNumber":
      return { type: "number" };
    case "ZodBoolean":
      return { type: "boolean" };
    case "ZodEnum":
      return { type: "string", enum: def.values };
    case "ZodArray":
      return { type: "array", items: zodToJsonSchema(def.type) };
    case "ZodOptional":
    case "ZodNullable":
      return zodToJsonSchema(def.innerType);
    case "ZodUnknown":
    case "ZodAny":
      return {};
    case "ZodObject": {
      const shape = def.shape();
      const props: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [k, v] of Object.entries<any>(shape)) {
        props[k] = zodToJsonSchema(v);
        if (!(v instanceof z.ZodOptional) && !(v instanceof z.ZodDefault)) required.push(k);
      }
      return { type: "object", properties: props, required, additionalProperties: false };
    }
    default:
      return {};
  }
}

export const mcpTools: McpTool[] = [
  tool(
    "list_projects",
    "List all projects the calling team participates in.",
    z.object({}),
    async teamId => ({ projects: await listProjectsForTeam(teamId) })
  ),
  tool(
    "create_project",
    "Create a new collaboration project. The calling team becomes its owner.",
    z.object({
      name: z.string().min(2).max(80),
      description: z.string().max(2000).optional(),
    }),
    async (teamId, args) => createProject(teamId, args)
  ),
  tool(
    "get_project",
    "Get details of a project by id. The calling team must be a member.",
    z.object({ projectId: z.string() }),
    async (teamId, args) => getProject(args.projectId)
  ),
  tool(
    "list_project_teams",
    "List all teams in a project.",
    z.object({ projectId: z.string() }),
    async (teamId, args) => ({ teams: await listProjectMembers(args.projectId) })
  ),
  tool(
    "invite_team",
    "Invite another team into a project, by team id, slug, or name.",
    z.object({ projectId: z.string(), team: z.string() }),
    async (teamId, args) => inviteTeamToProject(teamId, args.projectId, args.team)
  ),
  tool(
    "publish_request",
    "Publish a development request to another team in a project. Returns the new REQUEST thread.",
    z.object({
      projectId: z.string(),
      to: z.string().describe("Recipient team id, slug, or name."),
      title: z.string().min(2).max(200),
      body: z.string().min(1).max(20000).describe("Markdown allowed. Describe what you need."),
      metadata: z.unknown().optional().describe("Free-form JSON the agent can attach."),
    }),
    async (teamId, args) =>
      publishRequest(teamId, args.projectId, {
        toTeamSlugOrId: args.to,
        title: args.title,
        body: args.body,
        metadata: args.metadata,
      })
  ),
  tool(
    "list_requests",
    "List requests/deliveries for a project. Filter by box (inbox/outbox/all), status, and kind.",
    z.object({
      projectId: z.string(),
      box: z.enum(["inbox", "outbox", "all"]).optional(),
      status: z.string().optional(),
      kind: z.enum(["REQUEST", "DELIVERY"]).optional(),
    }),
    async (teamId, args) => ({
      threads: await listThreads(teamId, args.projectId, {
        box: args.box,
        status: args.status,
        kind: args.kind,
      }),
    })
  ),
  tool(
    "get_thread",
    "Fetch a thread (request or delivery) with comments, attachments, and child deliveries.",
    z.object({ threadId: z.string() }),
    async (teamId, args) => getThread(teamId, args.threadId)
  ),
  tool(
    "accept_request",
    "Accept an incoming request (recipient only).",
    z.object({ requestId: z.string() }),
    async (teamId, args) => acceptRequest(teamId, args.requestId)
  ),
  tool(
    "reject_request",
    "Reject an incoming request (recipient only).",
    z.object({ requestId: z.string() }),
    async (teamId, args) => rejectRequest(teamId, args.requestId)
  ),
  tool(
    "cancel_request",
    "Cancel an outgoing request (sender only).",
    z.object({ requestId: z.string() }),
    async (teamId, args) => cancelRequest(teamId, args.requestId)
  ),
  tool(
    "deliver_request",
    "Deliver a completion summary against a request. Creates a DELIVERY thread and moves the request to DELIVERED.",
    z.object({
      requestId: z.string(),
      title: z.string().min(2).max(200).optional(),
      summary: z.string().min(1).max(20000).describe("What was done, what changed, links/version, follow-ups."),
      metadata: z.unknown().optional(),
    }),
    async (teamId, args) =>
      deliverRequest(teamId, args.requestId, {
        title: args.title,
        summary: args.summary,
        metadata: args.metadata,
      })
  ),
  tool(
    "confirm_request",
    "Confirm completion of a delivered request (original requester only). Closes the loop.",
    z.object({ requestId: z.string() }),
    async (teamId, args) => confirmRequest(teamId, args.requestId)
  ),
  tool(
    "comment",
    "Post a comment on a thread (any project member).",
    z.object({ threadId: z.string(), body: z.string().min(1).max(20000) }),
    async (teamId, args) => addComment(teamId, args.threadId, args.body)
  ),
];

export const toolMap = new Map(mcpTools.map(t => [t.name, t]));
