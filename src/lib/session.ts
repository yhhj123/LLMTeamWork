// Cookie-based user sessions.
//
// The cookie's value is the Session row id (a cuid, sufficiently entropic).
// We do a single DB lookup per request to fetch the user. There's no JWT
// or in-memory caching — keeps revocation trivial and avoids signing keys.

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";

export const SESSION_COOKIE = "ltw_session";
const SESSION_TTL_DAYS = 30;

/**
 * Decide whether the session cookie should be marked Secure.
 *
 * Secure cookies are dropped by the browser when sent over plain HTTP, so we
 * cannot blindly enable it just because NODE_ENV=production — the user might
 * still be on http://... while a TLS cert is being set up. We auto-detect from
 * the forwarded proto header (set by nginx/Caddy/etc) per request.
 */
function getCookieSecure(): boolean {
  const env = process.env.COOKIE_SECURE;
  if (env === "true") return true;
  if (env === "false") return false;
  const proto = headers().get("x-forwarded-proto");
  return proto === "https";
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 3600 * 1000);
  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });
  cookies().set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: getCookieSecure(),
    path: "/",
    expires: expiresAt,
  });
  return session;
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { id: token } });
  }
  cookies().delete(SESSION_COOKIE);
}

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  teams: { id: string; name: string; slug: string; role: string }[];
};

/**
 * Resolve the current logged-in user (if any). Includes their team memberships.
 * Returns null when there is no session, the session is expired, or the user
 * was deleted.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: token },
    include: {
      user: {
        include: {
          memberships: { include: { team: true } },
        },
      },
    },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: token } }).catch(() => {});
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    teams: session.user.memberships.map(m => ({
      id: m.team.id,
      name: m.team.name,
      slug: m.team.slug,
      role: m.role,
    })),
  };
}

/** Like getCurrentUser but redirects to /login when there's no session. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Throws if the user isn't a member of the given team. */
export function assertUserInTeam(user: CurrentUser, teamId: string) {
  const m = user.teams.find(t => t.id === teamId);
  if (!m) throw new Error("You are not a member of that team.");
  return m;
}
