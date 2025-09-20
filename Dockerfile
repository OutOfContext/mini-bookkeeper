# ---------- Frontend Build ----------
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
RUN cd frontend && npm run build


# ---------- Backend Build ----------
FROM node:20-alpine AS backend-builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

COPY src/ ./src/
COPY prisma/ ./prisma/
RUN npx prisma generate
RUN npm run build:server

# Remove devDependencies to shrink size
RUN npm prune --omit=dev


# ---------- Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
# Prisma braucht OpenSSL
RUN apk add --no-cache openssl
# Copy only what is needed
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package.json ./package.json
COPY --from=backend-builder /app/prisma ./prisma
COPY --from=frontend-builder /app/frontend/dist ./public

ENV NODE_ENV=production
EXPOSE 8001

# Startup with DB migration + seed
CMD sh -c '\
  echo "🚀 Starting App..." && \
  if [ -n "$DATABASE_URL" ]; then \
    echo "📦 Setting up database..." && \
    npx prisma db push && \
    (npx prisma db seed || echo "⚠️ Seed failed"); \
  fi && \
  echo "🎯 Starting server..." && \
  node dist/server.js \
'
