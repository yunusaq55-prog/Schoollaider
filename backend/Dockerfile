FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy all workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY shared/ shared/
COPY backend/ backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared (outputs to shared/dist/) + backend
# v2: force rebuild after ESM fix
RUN pnpm --filter shared build && pnpm --filter backend run prisma:generate && pnpm --filter backend build

WORKDIR /app/backend

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
