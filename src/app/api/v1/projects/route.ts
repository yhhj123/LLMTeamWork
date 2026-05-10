import type { NextRequest } from "next/server";
import { withErrors, parseBody, ok, created } from "@/lib/http";
import { authenticateTeam } from "@/lib/auth";
import { ProjectCreate } from "@/lib/schemas";
import { createProject, listProjectsForTeam } from "@/lib/services";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    const list = await listProjectsForTeam(team!.id);
    return ok({ projects: list });
  });
}

export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    const input = await parseBody(req, ProjectCreate);
    const project = await createProject(team!.id, input);
    return created(project);
  });
}
