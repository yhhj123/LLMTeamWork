"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { generateApiKey, slugify } from "@/lib/ids";

const SignupSchema = z.object({
  email: z.string().email("Enter a valid email"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  teamName: z.string().min(2, "Team name must be at least 2 characters"),
});

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type ActionResult = { error?: string };

export async function signupAction(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = SignupSchema.safeParse({
    email: form.get("email"),
    displayName: form.get("displayName"),
    password: form.get("password"),
    teamName: form.get("teamName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { email, displayName, password, teamName } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) return { error: "An account with this email already exists." };

  // Pick a slug. If colliding, append a short suffix.
  let slug = slugify(teamName);
  let suffix = 0;
  while (await prisma.team.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(teamName)}-${suffix}`;
    if (suffix > 20) return { error: "Couldn't pick a unique team slug; try a different name." };
  }
  // Team-name uniqueness check (separate from slug because slug can be auto-suffixed).
  const nameTaken = await prisma.team.findUnique({ where: { name: teamName } });
  if (nameTaken) return { error: "A team with this name already exists." };

  const passwordHash = await hashPassword(password);

  const created = await prisma.$transaction(async tx => {
    const user = await tx.user.create({
      data: { email: normalizedEmail, displayName, passwordHash },
    });
    const team = await tx.team.create({
      data: {
        name: teamName,
        slug,
        apiKey: generateApiKey(),
        members: { create: { userId: user.id, role: "owner" } },
      },
    });
    return { user, team };
  });

  await createSession(created.user.id);
  redirect(`/teams?welcome=1&new=${created.team.id}`);
}

export async function loginAction(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.trim().toLowerCase() },
  });
  if (!user) return { error: "Invalid email or password." };
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return { error: "Invalid email or password." };

  await createSession(user.id);
  redirect("/projects");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
