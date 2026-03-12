FROM node:24-alpine AS builder

WORKDIR /app

# Install deps from app root
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
