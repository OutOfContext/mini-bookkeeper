# ---------- Build ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Nur die Lock/Package Files kopieren, damit der Cache greift
COPY package*.json ./
RUN npm ci

# Source rein & bauen
COPY . .
RUN npm run build

# ---------- Run (ohne Nginx) ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# winziger Static-Server für Node
RUN npm i -g serve@14

# Nur das Build-Resultat mitnehmen
COPY --from=builder /app/build ./build

# Non-root User verwenden
USER node
EXPOSE 3000

# Healthcheck ohne curl (nutzt Node's http)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# -s => SPA-Fallback, -l => Port
CMD ["serve", "-s", "build", "-l", "3000"]
