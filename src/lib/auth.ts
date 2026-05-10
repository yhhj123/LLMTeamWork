import type { NextRequest } from "next/server";
import { prisma } from "./db";

export type AuthedTeam = Awaited<ReturnType<typeof prisma.team.findUnique>>;

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function extractApiKey(req: Request | NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth) {
    const match = auth.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1].trim();
  }
  const headerKey = req.headers.get("x-api-key");
  if (headerKey) return headerKey.trim();
  return null;
}

export async function authenticateTeam(req: Request | NextRequest) {
  const key = extractApiKey(req);
  if (!key) throw new HttpError(401, "Missing API key. Use 'Authorization: Bearer <apiKey>' or 'X-Api-Key'.");
  const team = await prisma.team.findUnique({ where: { apiKey: key } });
  if (!team) throw new HttpError(401, "Invalid API key.");
  return team;
}

export async function assertProjectMember(teamId: string, projectId: string) {
  const m = await prisma.membership.findUnique({
    where: { teamId_projectId: { teamId, projectId } },
  });
  if (!m) throw new HttpError(403, "Team is not a member of this project.");
  return m;
}
