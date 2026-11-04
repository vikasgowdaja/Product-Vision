FROM node:20-alpine AS base
WORKDIR /app
COPY package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install deps
FROM base AS deps
RUN npm install --frozen-lockfile

# Build shared package
FROM deps AS build-shared
COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared

# Build API
FROM build-shared AS build-api
COPY apps/api/ ./apps/api/
RUN npm run build --workspace=apps/api

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build-api /app/node_modules ./node_modules
COPY --from=build-api /app/apps/api/dist ./dist
COPY --from=build-api /app/packages/shared/dist ./packages/shared/dist

EXPOSE 4000
CMD ["node", "dist/main"]
