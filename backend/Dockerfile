FROM node:20-slim AS base
WORKDIR /app

# deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>&1 | tail -5

# prisma schema + source
COPY prisma ./prisma
COPY src ./src
COPY ecosystem.config.js* ./

RUN npx prisma generate

EXPOSE 3000

# entrypoint jalankan migrate deploy lalu start
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
