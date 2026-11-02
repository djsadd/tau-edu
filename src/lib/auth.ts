import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";

export async function createSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, await signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    // Не NODE_ENV: контейнер всегда работает в production, а открывать его могут и по http://localhost.
    secure: (process.env.SITE_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export const getSessionUser = cache(async () => {
  const userId = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.id, userId));
  return user ?? null;
});

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/admin");
  return user;
}
