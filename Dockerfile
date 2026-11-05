# ---------- Stage 1: build the Next.js frontend as static files ----------
FROM node:22-bookworm-slim AS frontend
WORKDIR /frontend
COPY brain-frontend/package.json brain-frontend/package-lock.json ./
RUN npm ci
COPY brain-frontend/ ./
RUN npm run build
# -> static site in /frontend/out

# ---------- Stage 2: Express backend that also serves the frontend ----------
FROM node:22-bookworm-slim

# System Chromium for Puppeteer (scraper) + fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium fonts-liberation fonts-noto-color-emoji ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=3000 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./
COPY --from=frontend /frontend/out ./public
RUN mkdir -p uploads

EXPOSE 3000
CMD ["node", "server.js"]
