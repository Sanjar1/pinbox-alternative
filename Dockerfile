# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY app/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY app/ ./

# Build Next.js app
RUN npm run build

# Runtime stage
FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY app/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy prisma schema and migrations
COPY app/prisma ./prisma

# Expose port
EXPOSE 3000

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
