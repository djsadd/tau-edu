# Сайт университета TAU

Официальный многоязычный сайт (казахский, русский, английский) с панелью управления.
Работает в Docker как набор сервисов с общей базой PostgreSQL.

Стек: Next.js 16, TypeScript, Tailwind CSS 4, Hono, Drizzle ORM, PostgreSQL 18, nginx, Claude API.
Устройство сервисов и схема данных описаны в [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Запуск

Нужен только Docker.

```bash
./scripts/init-env.sh       # создаёт .env со случайными паролями
docker compose up -d --build --wait
```

- Сайт: http://localhost:3000
- Панель управления: http://localhost:3000/admin, логин и пароль в `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)

При первом запуске создаются таблицы, роли сервисов, администратор и демо-контент.

```bash
docker compose ps                    # состояние сервисов
docker compose logs -f search        # логи одного сервиса
docker compose up -d --build files   # пересобрать один сервис
docker compose down                  # остановить, данные сохраняются
docker compose down -v               # остановить и удалить базу и файлы
```

Тексты раздела «Поступление» и страницы контактов со старого сайта лежат в `src/db/content/admission.json`. Импорт перезаписывает страницы с этими адресами, а также название и контакты в настройках сайта, поэтому их правки из панели будут заменены:

```bash
npm run content:fetch   # скачать файлы старого сайта в data/legacy-files
docker compose run --rm -v "$PWD/data/legacy-files:/legacy:ro" -e LEGACY_FILES_DIR=/legacy migrate node import-content.cjs
```

## Продакшен

1. Выполните `./scripts/init-env.sh`. Задайте в `.env` настоящие `SITE_URL` и `ADMIN_EMAIL`.
2. Поставьте перед шлюзом прокси с HTTPS. `SITE_URL` с `https://` включает флаг `Secure` у cookie сессии.
3. Укажите адрес прокси в `TRUSTED_PROXY` (адрес или подсеть): только от него шлюз примет `X-Forwarded-For`, на который опираются лимиты запросов.
   Без этого все посетители будут считаться одним клиентом и упрутся в общий лимит.
4. `GATEWAY_BIND` задаёт, где слушает шлюз. По умолчанию порт доступен только с этого компьютера. Если прокси в другом месте, укажите, например, `0.0.0.0:3000`.
5. Включите в резервные копии оба тома: `tau_pgdata` и `tau_uploads`. База и файлы связаны, копировать их нужно вместе.

## ИИ-помощник

Задайте `ANTHROPIC_API_KEY` в `.env` и выполните `docker compose up -d assistant`. Модель меняется через `ASSISTANT_MODEL`, по умолчанию `claude-opus-5-5`.
Без ключа чат работает в режиме поиска и отвечает ссылками на страницы сайта.

## Разработка

База и сервисы работают в контейнерах, Next.js на хосте. Нужен Node.js 22+.

```bash
npm install
./scripts/init-env.sh
npm run dev:services        # база, сервисы и шлюз
npm run dev                 # next dev на порту 3100
```

Открывайте адрес шлюза, http://localhost:3000: `/api/*` и `/files/*` работают только через него. После изменений в `services/` повторите `npm run dev:services`.
В этом режиме Next.js ходит в базу под владельцем, а не под ролью `tau_web`, поэтому недостающие права проявятся только в полном запуске.

## Команды

| Команда | Что делает |
| --- | --- |
| `npm run dev:services` / `npm run dev` | Окружение разработки |
| `npm run lint` | Проверка типов |
| `npm run db:generate` | Новая миграция после изменения `src/db/schema.ts` |
| `npm run db:migrate` | Применить миграции и права (при запуске контейнеров выполняется само) |
# tau-edu
