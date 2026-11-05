# syntax=docker/dockerfile:1.7
#
# One image: the Next.js frontend is exported as static files and served by the
# Express backend, which also runs the BullMQ worker and Puppeteer scraper.
#
#   docker compose up -d --build

ARG NODE_IMAGE=node:22-bookworm-slim

# ---------- Stage 1: build the Next.js frontend as static files ----------
FROM ${NODE_IMAGE} AS frontend
WORKDIR /frontend
ENV NEXT_TELEMETRY_DISABLED=1

# Install deps first so this layer is cached until package*.json changes.
COPY brain-frontend/package.json brain-frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

COPY brain-frontend/ ./
RUN npm run build
# -> static site in /frontend/out

# ---------- Stage 2: backend production dependencies ----------
FROM ${NODE_IMAGE} AS backend-deps
WORKDIR /app
# Use Debian's Chromium (installed below) instead of Puppeteer's ~170MB download.
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY backend/package.json backend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --no-audit --no-fund

# ---------- Stage 3: runtime ----------
FROM ${NODE_IMAGE} AS runtime

# chromium: headless browser for the scraper
# tini:     PID 1 that reaps Chromium's child processes (otherwise they pile up as zombies)
# fonts:    basic fonts so Chromium can lay out pages
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium tini ca-certificates \
      fonts-liberation fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=3000 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# App code stays root-owned (read-only for the app user); only uploads/ is writable.
COPY --from=backend-deps /app/node_modules ./node_modules
COPY backend/ ./
COPY --from=frontend /frontend/out ./public
RUN mkdir -p uploads && chown node:node uploads

# Run as the unprivileged "node" user that ships with the official image.
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
