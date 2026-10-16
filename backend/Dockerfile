FROM node:20-slim AS base
WORKDIR /app

# deps
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# prisma schema + source
COPY prisma ./prisma
COPY src ./src
COPY ecosystem.config.js* ./

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npx prisma generate

EXPOSE 3000

# Terapkan migration dan seed referensi/admin awal sebelum server menerima request.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run prisma:seed && node src/server.js"]
