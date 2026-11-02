import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { closeDb, getDb } from "./index";
import { provisionRoles } from "./roles";

async function main() {
  const db = getDb();
  // В базе не в UTF-8 поиск молча перестаёт находить кириллицу, а вместе с ним теряет контекст и ИИ-помощник.
  const { rows } = await db.execute(sql`SELECT pg_encoding_to_char(encoding) AS encoding FROM pg_database WHERE datname = current_database()`);
  if (rows[0]?.encoding !== "UTF8") {
    throw new Error(`База должна быть в кодировке UTF8, сейчас: ${rows[0]?.encoding}. Создайте её с ENCODING 'UTF8'.`);
  }
  await migrate(db, { migrationsFolder: process.env.MIGRATIONS_DIR || "./src/db/migrations" });
  await provisionRoles(db);
  await closeDb();
  console.log("Миграции применены");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
