import { build } from "esbuild";

/** Каждый сервис собирается в один файл: в образ не нужно класть node_modules. */
const entries = {
  search: "services/search/index.ts",
  assistant: "services/assistant/index.ts",
  files: "services/files/index.ts",
  admissions: "services/admissions/index.ts",
  migrate: "src/db/migrate.ts",
  seed: "src/db/seed.ts",
};

await build({
  entryPoints: entries,
  outdir: "dist",
  outExtension: { ".js": ".cjs" },
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  // Необязательная зависимость pg, в образах её нет.
  external: ["pg-native"],
  logLevel: "warning",
});
