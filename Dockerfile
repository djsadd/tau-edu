FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm run build:services

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
# Каталог создаётся заранее: новый том наследует его владельца, и сервис может писать без root.
RUN mkdir -p /data/uploads && chown node:node /data/uploads
USER node

FROM runtime AS web
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static
ENV HOSTNAME=0.0.0.0 PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]

FROM runtime AS migrate
COPY --from=builder /app/dist/migrate.cjs /app/dist/seed.cjs /app/dist/import-content.cjs ./
COPY --from=builder /app/src/db/migrations ./migrations
ENV MIGRATIONS_DIR=/app/migrations
CMD ["sh", "-c", "node migrate.cjs && node seed.cjs"]

FROM runtime AS service
ARG SERVICE
COPY --from=builder /app/dist/${SERVICE}.cjs ./service.cjs
CMD ["node", "service.cjs"]
