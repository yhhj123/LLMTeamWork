"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { updateTeam } from "@/lib/services";

const UpdateTeamSchema = z.object({
  teamId: z.string().min(1),
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type UpdateTeamResult = { ok?: true; error?: string };

/**
 * Update team name / description. The caller must be an owner or admin of
 * the team. Slug is intentionally immutable.
 */
export async function updateTeamAction(
  _prev: UpdateTeamResult,
  form: FormData
): Promise<UpdateTeamResult> {
  const user = await requireUser();
  const parsed = UpdateTeamSchema.safeParse({
    teamId: form.get("teamId"),
    name: form.get("name"),
    description: form.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const m = user.teams.find(t => t.id === parsed.data.teamId);
  if (!m) return { error: "You don't belong to that team." };
  if (m.role !== "owner" && m.role !== "admin") {
    return { error: "Only team owners and admins can edit team info." };
  }
  try {
    await updateTeam(parsed.data.teamId, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update team" };
  }
  revalidatePath(`/teams/${parsed.data.teamId}`);
  revalidatePath("/teams");
  revalidatePath("/me");
  return { ok: true };
}
