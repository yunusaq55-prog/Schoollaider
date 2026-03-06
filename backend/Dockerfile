FROM node:20-slim
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

WORKDIR /app/backend

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
