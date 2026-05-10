# Railway Dockerfile - Backend in subdirectory
FROM node:18-alpine

WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy backend files from subdirectory
COPY Untitled/backend/package*.json ./
COPY Untitled/backend/tsconfig.json ./

# Install dependencies
RUN npm install

# Rebuild better-sqlite3 to compile native bindings for Alpine
RUN npm rebuild better-sqlite3 --build-from-source

# Copy source code
COPY Untitled/backend/src ./src

# Create data directory (SQLite will use this)
RUN mkdir -p /data

# Build TypeScript manually
RUN npx tsc

# Expose port
EXPOSE 3001

# Start command - database initializes automatically on server start
CMD ["sh", "-c", "mkdir -p /data && node dist/server.js"]
