# Multi-stage build for EatTogether Full-Stack App
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN npm --prefix client install
RUN npm --prefix server install

# Copy source code
COPY . .

# Build client and server
RUN npm run build

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
COPY server/package*.json ./server/

# Install production dependencies only
RUN npm --prefix server install --omit=dev

# Copy build artifacts
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Create data directory for persistent store
RUN mkdir -p server/data

EXPOSE 3001

VOLUME ["/app/server/data"]

CMD ["node", "server/dist/index.js"]
