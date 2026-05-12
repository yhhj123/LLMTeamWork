"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, assertUserInTeam } from "@/lib/session";
import {
  createProject,
  inviteTeamToProject,
  updateProjectArchitecture,
  updateMembershipScope,
} from "@/lib/services";

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

export type InviteResult = { ok?: true; invitedName?: string; error?: string };

export async function inviteTeamAction(
  _prev: InviteResult,
  form: FormData
): Promise<InviteResult> {
  const user = await requireUser();
  const parsed = InviteSchema.safeParse({
    projectId: form.get("projectId"),
    team: form.get("team"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Find a team the user belongs to that is ALSO already in this project.
  // That team is the inviter (service-layer assertProjectMember enforces this).
  const userTeamIds = user.teams.map(t => t.id);
  if (userTeamIds.length === 0) {
    return { error: "You don't belong to any team yet." };
  }
  const inviter = await prisma.membership.findFirst({
    where: { projectId: parsed.data.projectId, teamId: { in: userTeamIds } },
    select: { teamId: true },
  });
  if (!inviter) {
    return {
      error:
        "None of your teams are in this project, so you can't invite others. Ask a current member to invite you first.",
    };
  }

  try {
    const invited = await inviteTeamToProject(
      inviter.teamId,
      parsed.data.projectId,
      parsed.data.team
    );
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { ok: true, invitedName: invited.name };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to invite team" };
  }
}

// ----- Architecture editing ----------------------------------------------

const ArchSchema = z.object({
  projectId: z.string().min(1),
  architecture: z.string().max(50_000).optional().or(z.literal("").transform(() => undefined)),
});

export type ArchitectureResult = { ok?: true; error?: string };

export async function updateArchitectureAction(
  _prev: ArchitectureResult,
  form: FormData
): Promise<ArchitectureResult> {
  const user = await requireUser();
  const parsed = ArchSchema.safeParse({
    projectId: form.get("projectId"),
    architecture: form.get("architecture") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Find a team the user belongs to that owns this project.
  const userTeamIds = user.teams.map(t => t.id);
  const owner = await prisma.membership.findFirst({
    where: {
      projectId: parsed.data.projectId,
      role: "owner",
      teamId: { in: userTeamIds },
    },
    select: { teamId: true },
  });
  if (!owner) {
    return { error: "Only members of the project-owner team can edit the architecture." };
  }
  try {
    await updateProjectArchitecture(
      owner.teamId,
      parsed.data.projectId,
      parsed.data.architecture ?? null
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update architecture" };
  }
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true };
}

const ScopeSchema = z.object({
  projectId: z.string().min(1),
  teamId: z.string().min(1),
  scope: z.string().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export type ScopeResult = { ok?: true; error?: string };

export async function updateScopeAction(
  _prev: ScopeResult,
  form: FormData
): Promise<ScopeResult> {
  const user = await requireUser();
  const parsed = ScopeSchema.safeParse({
    projectId: form.get("projectId"),
    teamId: form.get("teamId"),
    scope: form.get("scope") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const userTeamIds = user.teams.map(t => t.id);
  // Caller team is preferably the team being edited (if user belongs to it),
  // otherwise the owner team they belong to.
  let callerTeamId: string | null = null;
  if (userTeamIds.includes(parsed.data.teamId)) {
    callerTeamId = parsed.data.teamId;
  } else {
    const owner = await prisma.membership.findFirst({
      where: {
        projectId: parsed.data.projectId,
        role: "owner",
        teamId: { in: userTeamIds },
      },
      select: { teamId: true },
    });
    callerTeamId = owner?.teamId ?? null;
  }
  if (!callerTeamId) {
    return { error: "You can only edit scope for a team you belong to, or as project owner." };
  }
  try {
    await updateMembershipScope(
      callerTeamId,
      parsed.data.projectId,
      parsed.data.teamId,
      parsed.data.scope ?? null
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update scope" };
  }
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true };
}
