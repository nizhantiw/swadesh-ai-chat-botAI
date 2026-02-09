# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --omit=dev --ignore-scripts && \
    npm ci --ignore-scripts

# ── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules 2>/dev/null || true

# Copy source
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Build shared package first, then backend
WORKDIR /app/packages/shared
RUN npx tsc || true

WORKDIR /app/apps/backend
RUN npx tsc || true

# ── Stage 3: Production ────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install only what we need at runtime
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --omit=dev --ignore-scripts

# Copy built output
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/drizzle.config.ts ./apps/backend/
COPY --from=builder /app/apps/backend/src/db ./apps/backend/src/db

# Copy drizzle-kit + tsx for migrations/seed (needed at runtime for db:push + seed)
COPY --from=deps /app/node_modules ./node_modules

WORKDIR /app/apps/backend

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]
