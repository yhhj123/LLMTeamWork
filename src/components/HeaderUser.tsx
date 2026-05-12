import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/app/(auth)/actions";

export async function HeaderUser() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="ml-auto flex items-center gap-3 text-sm">
        <Link href="/login">Log in</Link>
        <Link
          href="/signup"
          className="rounded-md bg-accent text-white px-3 py-1.5 no-underline"
        >
          Sign up
        </Link>
      </div>
    );
  }
  return (
    <div className="ml-auto flex items-center gap-3 text-sm">
      <Link
        href="/me"
        className="text-right leading-tight no-underline hover:opacity-80"
        aria-label="Open profile"
      >
        <div className="font-medium text-slate-800">{user.displayName}</div>
        <div className="text-xs text-slate-500">{user.email}</div>
      </Link>
      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
