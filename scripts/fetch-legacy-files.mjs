import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** Скачивает файлы старого сайта для импорта: контейнер импорта не имеет выхода в интернет. */
const dir = path.resolve(process.env.LEGACY_FILES_DIR || "./data/legacy-files");
const { files } = JSON.parse(await readFile("src/db/content/admission.json", "utf8"));

await mkdir(dir, { recursive: true });
for (const file of files) {
  const target = path.join(dir, file.key);
  if (existsSync(target)) continue;
  const response = await fetch(file.url);
  if (!response.ok) throw new Error(`${file.url}: ${response.status}`);
  await writeFile(target, new Uint8Array(await response.arrayBuffer()));
  console.log(file.name);
}
console.log(`Файлы в ${dir}`);
