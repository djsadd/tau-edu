import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

/** Hot reload и несколько бандлов Next не должны открывать второй пул подключений. */
const store = globalThis as unknown as { __tauDb?: Db; __tauPool?: Pool };

function open(): Db {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL не задан");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DATABASE_POOL_SIZE) || 10 });
  store.__tauPool = pool;
  return drizzle(pool, { schema });
}

export function getDb(): Db {
  return (store.__tauDb ??= open());
}

/** Ленивая обёртка: `next build` импортирует модули, но не должен открывать базу. */
export const db = new Proxy({} as Db, {
  get(_, prop) {
    const target = getDb() as unknown as Record<string | symbol, unknown>;
    const value = target[prop];
    return typeof value === "function" ? value.bind(target) : value;
  },
});

export async function closeDb() {
  await store.__tauPool?.end();
  store.__tauDb = undefined;
  store.__tauPool = undefined;
}

export { schema };
