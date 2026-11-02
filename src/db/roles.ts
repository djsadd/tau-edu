import { sql } from "drizzle-orm";
import type { getDb } from "./index";

type Grants = Record<string, string>;

const CONTENT = ["faculties", "departments", "degrees", "programs", "offices", "persons", "appointments", "news", "events", "student_orgs", "pages"];

/**
 * Каждый сервис ходит в базу под своей ролью и видит только свои таблицы.
 * Внешние ключи между таблицами разных сервисов остаются: их проверяет сама база, прав роли для этого не нужно.
 */
const ROLES: Record<string, { password: string; grants: Grants }> = {
  tau_web: {
    password: "DB_PASSWORD_WEB",
    grants: Object.fromEntries(
      [...CONTENT, "menu_items", "site_settings", "users"].map((table) => [table, "SELECT, INSERT, UPDATE, DELETE"]),
    ),
  },
  tau_search: {
    password: "DB_PASSWORD_SEARCH",
    grants: { search_documents: "SELECT, INSERT, UPDATE, DELETE", ...Object.fromEntries(CONTENT.map((table) => [table, "SELECT"])) },
  },
  tau_files: {
    password: "DB_PASSWORD_FILES",
    grants: { media_files: "SELECT, INSERT, UPDATE, DELETE", media_folders: "SELECT, INSERT, UPDATE, DELETE", users: "SELECT (id)" },
  },
  tau_admissions: {
    password: "DB_PASSWORD_ADMISSIONS",
    grants: { applications: "SELECT, INSERT, UPDATE, DELETE", programs: "SELECT", degrees: "SELECT" },
  },
  tau_assistant: {
    password: "DB_PASSWORD_ASSISTANT",
    grants: { site_settings: "SELECT" },
  },
};

const literal = (value: string) => `'${value.replace(/'/g, "''")}'`;

/** Повторный запуск приводит права к описанным здесь: лишние снимаются, пароли обновляются. */
export async function provisionRoles(db: ReturnType<typeof getDb>) {
  for (const [role, { password, grants }] of Object.entries(ROLES)) {
    const value = process.env[password];
    if (!value) {
      console.warn(`${password} не задан, роль ${role} пропущена`);
      continue;
    }
    await db.execute(sql.raw(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = ${literal(role)}) THEN
          CREATE ROLE ${role} LOGIN;
        END IF;
      END $$;
    `));
    await db.execute(sql.raw(`ALTER ROLE ${role} LOGIN PASSWORD ${literal(value)}`));
    await db.execute(sql.raw(`GRANT USAGE ON SCHEMA public TO ${role}`));
    await db.execute(sql.raw(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ${role}`));
    for (const [table, privileges] of Object.entries(grants)) {
      await db.execute(sql.raw(`GRANT ${privileges} ON ${table} TO ${role}`));
    }
  }
}
