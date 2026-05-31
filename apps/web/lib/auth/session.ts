import { redirect } from "next/navigation";
import { auth } from "./config";

/** Requires an authenticated session; redirects to /sign-in otherwise. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return session;
}

/** Returns the authenticated user's ID or redirects. */
export async function requireUserId(): Promise<string> {
  const session = await requireSession();
  const id = (session.user as { id?: string } | undefined)?.id;
  if (!id) redirect("/sign-in");
  return id;
}

/** Returns the session without redirecting (null when unauthenticated). */
export async function getOptionalSession() {
  return auth();
}
