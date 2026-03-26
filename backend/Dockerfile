# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# better-sqlite3 precisa de ferramentas de compilação nativa
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

RUN apk add --no-cache libstdc++

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Pasta para o banco SQLite (montada via volume)
RUN mkdir -p /data

ENV PORT=3001
ENV NODE_ENV=production
ENV DB_PATH=/data/lazersp.db

EXPOSE 3001

# Roda seed (ignora se dados já existem) e inicia o servidor
CMD ["sh", "-c", "node src/database/seed.js && node src/server.js"]
