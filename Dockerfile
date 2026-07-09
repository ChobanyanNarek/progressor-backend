FROM node:22-slim AS base
# node:22-slim no longer ships corepack reliably, so install pnpm directly
# (matches the "packageManager" field in package.json).
RUN npm install -g pnpm@10.26.2
# Disable husky during `pnpm install` — the image has no .git (it's in
# .dockerignore), so the prepare->husky script would otherwise fail the build.
ENV HUSKY=0

# --- Build stage: compile TypeScript ---
FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build:prod

# --- Production dependencies stage ---
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# --ignore-scripts: --prod omits devDeps (incl. husky), but the `prepare`
# lifecycle still calls `husky`, which would be missing -> "husky: not found".
# Production deps don't need git hooks, so skip lifecycle scripts here.
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# --- Final runtime image ---
FROM node:22-slim

ARG PORT=3000

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=8192"

WORKDIR /usr/src/app

COPY --from=build /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./

EXPOSE $PORT

CMD ["node", "dist/main.js"]
