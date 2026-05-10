# Railway Dockerfile - Backend in subdirectory
FROM node:18-alpine

WORKDIR /app

# Copy backend files from subdirectory
COPY Untitled/backend/package*.json ./
COPY Untitled/backend/tsconfig.json ./

# Install dependencies (skip postinstall build)
RUN npm install --ignore-scripts

# Copy source code
COPY Untitled/backend/src ./src

# Create data directory (SQLite will use this)
RUN mkdir -p /data

# Build TypeScript manually
RUN npx tsc

# Expose port
EXPOSE 3001

# Start command
CMD ["sh", "-c", "mkdir -p /data && node dist/db/init.js && node dist/server.js"]
