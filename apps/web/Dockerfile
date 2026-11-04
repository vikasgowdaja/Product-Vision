FROM node:20-alpine AS base
WORKDIR /app
COPY package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

FROM base AS deps
RUN npm install --frozen-lockfile

FROM deps AS build
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/
RUN npm run build --workspace=apps/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
