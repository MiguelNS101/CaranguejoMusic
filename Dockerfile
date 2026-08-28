# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build Vite frontend & esbuild server
RUN npm run build

# Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# Create data directory for persistence
RUN mkdir -p /app/data/uploads /app/data/music /app/data/sfx /app/data/npcs

# Copy only production dependencies & built assets
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/server.cjs ./dist/server.cjs

# Expose port
EXPOSE 3000

# Volume for data persistence (db.json, audio files, uploaded images)
VOLUME ["/app/data"]

CMD ["node", "dist/server.cjs"]
