import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await db.execute(sql`SELECT 1`);
  return Response.json({ status: "ok", service: "web" });
}
