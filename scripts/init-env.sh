#!/bin/sh
# Создаёт .env и заполняет случайными значениями только пустые секреты. Заданные значения не меняются.
set -eu
cd "$(dirname "$0")/.."
umask 077

[ -f .env ] || cp .env.example .env

set_if_empty() {
  grep -q "^$1=." .env && return 0
  grep -v "^$1=" .env > .env.tmp || true
  printf '%s=%s\n' "$1" "$2" >> .env.tmp
  mv .env.tmp .env
}

for key in POSTGRES_PASSWORD DB_PASSWORD_WEB DB_PASSWORD_SEARCH DB_PASSWORD_FILES DB_PASSWORD_ADMISSIONS DB_PASSWORD_ASSISTANT INTERNAL_TOKEN SESSION_SECRET; do
  set_if_empty "$key" "$(openssl rand -hex 32)"
done
set_if_empty ADMIN_PASSWORD "$(openssl rand -hex 12)"

# Для локальных команд npm run db:* и npm run dev: контейнеры получают свои адреса из docker-compose.yml.
postgres_password=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2-)
set_if_empty DATABASE_URL "postgresql://tau:$postgres_password@localhost:5432/tau"

chmod 600 .env
echo "Готово. Логин панели: $(grep '^ADMIN_EMAIL=' .env | cut -d= -f2-), пароль лежит в .env (ADMIN_PASSWORD)."
