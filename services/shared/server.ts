import { timingSafeEqual } from "node:crypto";
import { serve } from "@hono/node-server";
import { sql } from "drizzle-orm";
import { Hono, type MiddlewareHandler } from "hono";
import { closeDb, db } from "@/db";

function sameToken(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Адреса /internal/* не публикуются шлюзом, а токен защищает их и внутри сети контейнеров. */
export const internalOnly: MiddlewareHandler = async (c, next) => {
  const expected = process.env.INTERNAL_TOKEN;
  if (!expected) throw new Error("INTERNAL_TOKEN не задан");
  const given = c.req.header("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!sameToken(given, expected)) return c.json({ error: "forbidden" }, 403);
  await next();
};

export function createService(name: string) {
  const app = new Hono();
  app.use(async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
  });
  app.onError((error, c) => {
    console.error(`[${name}] ${c.req.method} ${c.req.path}`, error);
    return c.json({ error: "internal" }, 500);
  });
  app.get("/health", async (c) => {
    await db.execute(sql`SELECT 1`);
    return c.json({ status: "ok", service: name });
  });
  app.use("/internal/*", internalOnly);
  return app;
}

export function startService(app: Hono, name: string, defaultPort: number, onStop?: () => void) {
  const port = Number(process.env.PORT) || defaultPort;
  const server = serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => console.log(`[${name}] слушает порт ${port}`));
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      onStop?.();
      server.close(() => void closeDb().finally(() => process.exit(0)));
      // Незавершённый стрим чата не должен задерживать остановку контейнера.
      setTimeout(() => process.exit(0), 5000).unref();
    });
  }
}
