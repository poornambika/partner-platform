# Multi-stage production build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package definitions
COPY package.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY server/ ./server/
COPY client/ ./client/

# Generate Prisma client and build both server and client
RUN cd server && npx prisma generate
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY package.json ./
COPY server/package*.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 5000

# Push DB schema and start server
CMD ["sh", "-c", "cd server && npx prisma db push && node dist/index.js"]
