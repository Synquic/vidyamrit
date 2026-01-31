# Multi-stage Dockerfile for Vidyamrit
# This builds both frontend and backend in a single image

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY pwa/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source (including .env.production if exists)
COPY pwa/ ./

# Build frontend for production (Vite will use .env.production)
RUN npm run build -- --mode production

# Stage 2: Build Backend
FROM node:18-alpine AS backend-build

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
COPY backend/tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy backend source
COPY backend/ ./

# Build TypeScript
RUN npm run build

# Stage 3: Production Image
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy built backend from build stage
COPY --from=backend-build /app/backend/dist ./dist

# Copy backend configuration files
COPY --from=backend-build /app/backend/firebaseServiceAccountKey.json ./firebaseServiceAccountKey.json

# Copy built frontend from build stage
COPY --from=frontend-build /app/frontend/dist ./public

# Create logs directory
RUN mkdir -p ./logs

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
