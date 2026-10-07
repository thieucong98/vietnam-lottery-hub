# ==========================================
# Multi-stage Dockerfile for React Frontend
# ==========================================

# Stage 1: Build Frontend
FROM node:20-alpine AS builder

WORKDIR /app/web

# Copy package manifests and install dependencies
COPY web/package.json web/package-lock.json ./
RUN npm ci

# Copy web source and assets
COPY web/ ./

# Build production bundle
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine-slim AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built application from builder stage
COPY --from=builder /app/web/dist /usr/share/nginx/html

# Copy custom optimized Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
