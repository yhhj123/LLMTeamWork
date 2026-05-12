"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { generateApiKey } from "@/lib/ids";

export type RotateResult = { ok?: true; apiKey?: string; error?: string };

/**
 * Rotate the API key of a team the calling user owns. Returns the new key
 * once — the page should display it (the old key stops working immediately).
 */
export async function rotateTeamApiKeyAction(teamId: string): Promise<RotateResult> {
  const user = await requireUser();
  const m = user.teams.find(t => t.id === teamId);
  if (!m) return { error: "You don't belong to that team." };
  if (m.role !== "owner") return { error: "Only team owners can rotate the API key." };

  const team = await prisma.team.update({
    where: { id: teamId },
    data: { apiKey: generateApiKey() },
  });
  revalidatePath("/me");
  return { ok: true, apiKey: team.apiKey };
}
