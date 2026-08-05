# syntax=docker/dockerfile:1

# Install deps in a separate stage so the npm ci layer caches on package*.json
# alone and is not invalidated by application code changes.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci respects package-lock.json for reproducible builds. --omit=dev is a
# no-op today (no devDependencies) but keeps this correct if any are added.
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
# NODE_ENV=production is load-bearing: the global error handler in app.js only
# masks internal error messages from clients when it is set.
# PORT=8080 matches the default application port on Starlight Hyperlift.
ENV NODE_ENV=production \
    PORT=8080
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
# The app writes nothing to disk (logs go to stdout/stderr), so it runs unprivileged.
USER node
EXPOSE 8080
# Exec form so node is PID 1 and receives SIGTERM directly on `docker stop`.
CMD ["node", "app.js"]
