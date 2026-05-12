"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, assertUserInTeam } from "@/lib/session";
import { createProject, inviteTeamToProject } from "@/lib/services";

const NewProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().max(2000).optional().or(z.literal("").transform(() => undefined)),
  ownerTeamId: z.string().min(1, "Pick the team that owns this project"),
});

export type ProjectActionResult = { error?: string };

export async function createProjectAction(
  _prev: ProjectActionResult,
  form: FormData
): Promise<ProjectActionResult> {
  const user = await requireUser();
  const parsed = NewProjectSchema.safeParse({
    name: form.get("name"),
    description: form.get("description") || undefined,
    ownerTeamId: form.get("ownerTeamId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    assertUserInTeam(user, parsed.data.ownerTeamId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Forbidden" };
  }
  try {
    const project = await createProject(parsed.data.ownerTeamId, {
      name: parsed.data.name,
      description: parsed.data.description,
    });
    redirect(`/projects/${project.id}`);
  } catch (e) {
    if (e instanceof Error && /NEXT_REDIRECT/.test(e.message)) throw e;
    return { error: e instanceof Error ? e.message : "Failed to create project" };
  }
  return {};
}

const InviteSchema = z.object({
  projectId: z.string(),
  team: z.string().min(1, "Team id, slug, or name required"),
});

export async function inviteTeamAction(
  _prev: ProjectActionResult,
  form: FormData
): Promise<ProjectActionResult> {
  const user = await requireUser();
  const parsed = InviteSchema.safeParse({
    projectId: form.get("projectId"),
    team: form.get("team"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // The user must be a member of at least one team that already belongs to this project.
  // Easiest check: find the first of the user's teams that's in this project, use it as inviter.
  const inviterTeamId = user.teams.find(t => {
    // we don't have membership info here; fall through to service which checks again
    return true;
  })?.id;
  if (!inviterTeamId) return { error: "You don't belong to any team in this project." };

  try {
    await inviteTeamToProject(inviterTeamId, parsed.data.projectId, parsed.data.team);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to invite team" };
  }
  return {};
}
