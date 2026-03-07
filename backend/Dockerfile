# Backend (Bun + Prisma) — deploy on Render with Docker
FROM oven/bun:1-alpine

WORKDIR /app

# Install deps (lockfile for reproducible builds)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# App and Prisma
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
COPY index.ts ./

# Generate Prisma client
RUN bun run build

# Migrations run at startup; server uses PORT from env
ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "bunx prisma migrate deploy && bun run start"]
