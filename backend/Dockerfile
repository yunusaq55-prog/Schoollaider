FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy package.json files for dependency resolution
COPY shared/package.json shared/
COPY backend/package.json backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY shared/ shared/
COPY backend/ backend/

# Build shared + backend
RUN pnpm --filter shared build
RUN pnpm --filter backend run prisma:generate
RUN pnpm --filter backend build

# Production stage
FROM node:20-slim AS production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json shared/
COPY backend/package.json backend/

RUN pnpm install --frozen-lockfile --prod

COPY --from=base /app/shared/dist/ shared/dist/
COPY --from=base /app/shared/package.json shared/
COPY --from=base /app/backend/dist/ backend/dist/
COPY --from=base /app/backend/prisma/ backend/prisma/
COPY --from=base /app/backend/node_modules/.prisma/ backend/node_modules/.prisma/

WORKDIR /app/backend

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
