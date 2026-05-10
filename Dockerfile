# Railway Dockerfile - Backend in subdirectory
FROM node:18-alpine

WORKDIR /app

# Copy backend files from subdirectory
COPY Untitled/backend/package*.json ./
COPY Untitled/backend/tsconfig.json ./
COPY Untitled/backend/.env.example ./

# Install dependencies
RUN npm install

# Copy source code
COPY Untitled/backend/src ./src
COPY Untitled/backend/data ./data

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start command
CMD ["sh", "-c", "npm run db:init && npm start"]
