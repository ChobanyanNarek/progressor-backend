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
COPY package.json pnpm-lock.yaml pnpm.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build:prod

# --- Production dependencies stage ---
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm.yaml ./
# husky is a devDep absent with --prod, but the root "prepare": "husky" script
# would still run and fail.  Strip it from package.json before install so
# pnpm does not try to invoke the missing binary.  Native production deps
# (bcrypt, sharp, …) are allowed to run via pnpm.yaml onlyBuiltDependencies.
RUN node -e "const fs=require('fs'),p=JSON.parse(fs.readFileSync('package.json')); delete p.scripts.prepare; fs.writeFileSync('package.json',JSON.stringify(p))"
RUN pnpm install --frozen-lockfile --prod

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
