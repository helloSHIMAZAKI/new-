# Production Dockerfile for ABA PayWay OBS Overlay
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build both frontend and server bundle
COPY . .
RUN npm run build

# Production Runner stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled bundles from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "dist/server.js"]
