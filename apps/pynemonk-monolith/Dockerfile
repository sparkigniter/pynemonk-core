# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /repo

# Copy workspace manifests first (layer cache)
COPY package.json package-lock.json ./
COPY services/pynemonk-core-auth/package.json ./services/pynemonk-core-auth/
COPY services/pynemonk-core-school/package.json ./services/pynemonk-core-school/
COPY services/pynemonk-core-accounting/package.json ./services/pynemonk-core-accounting/
COPY services/pynemonk-core-system/package.json     ./services/pynemonk-core-system/
COPY apps/pynemonk-monolith/package.json      ./apps/pynemonk-monolith/

RUN npm ci --workspaces --include-workspace-root

# Copy source and compile
COPY services/pynemonk-core-auth/ ./services/pynemonk-core-auth/
COPY services/pynemonk-core-school/ ./services/pynemonk-core-school/
COPY services/pynemonk-core-accounting/ ./services/pynemonk-core-accounting/
COPY services/pynemonk-core-system/     ./services/pynemonk-core-system/
COPY apps/pynemonk-monolith/      ./apps/pynemonk-monolith/

RUN npm run build --workspace=services/pynemonk-core-auth
RUN npm run build --workspace=services/pynemonk-core-school
RUN npm run build --workspace=services/pynemonk-core-accounting
RUN npm run build --workspace=services/pynemonk-core-system
RUN npm run build --workspace=apps/pynemonk-monolith

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy workspace manifests + lockfile so npm ci can install prod deps
COPY --from=builder /repo/package.json                                  ./package.json
COPY --from=builder /repo/package-lock.json                             ./package-lock.json
COPY --from=builder /repo/services/pynemonk-core-auth/package.json      ./services/pynemonk-core-auth/package.json
COPY --from=builder /repo/services/pynemonk-core-school/package.json    ./services/pynemonk-core-school/package.json
COPY --from=builder /repo/services/pynemonk-core-accounting/package.json ./services/pynemonk-core-accounting/package.json
COPY --from=builder /repo/services/pynemonk-core-system/package.json     ./services/pynemonk-core-system/package.json
COPY --from=builder /repo/apps/pynemonk-monolith/package.json           ./apps/pynemonk-monolith/package.json

# Let npm wire up the workspace properly (correct hoisting, no symlink hacks)
RUN npm ci --omit=dev --workspaces --include-workspace-root

# Copy compiled output (after npm ci so node_modules layer is cached)
COPY --from=builder /repo/services/pynemonk-core-auth/dist              ./services/pynemonk-core-auth/dist
COPY --from=builder /repo/services/pynemonk-core-school/dist            ./services/pynemonk-core-school/dist
COPY --from=builder /repo/services/pynemonk-core-accounting/dist        ./services/pynemonk-core-accounting/dist
COPY --from=builder /repo/services/pynemonk-core-system/dist            ./services/pynemonk-core-system/dist
COPY --from=builder /repo/apps/pynemonk-monolith/dist                   ./apps/pynemonk-monolith/dist
COPY --from=builder /repo/services/pynemonk-core-auth/sql               ./services/pynemonk-core-auth/sql
COPY --from=builder /repo/services/pynemonk-core-school/sql             ./services/pynemonk-core-school/sql
COPY --from=builder /repo/services/pynemonk-core-accounting/sql         ./services/pynemonk-core-accounting/sql
COPY --from=builder /repo/services/pynemonk-core-school/src/scripts      ./services/pynemonk-core-school/src/scripts
COPY --from=builder /repo/apps/pynemonk-monolith/scripts                ./apps/pynemonk-monolith/scripts

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "apps/pynemonk-monolith/dist/server.js"]
