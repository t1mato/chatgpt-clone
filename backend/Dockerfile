# Backend Dockerfile for Talk Talk Goose
# Multi-stage build for optimized production image

# Stage 1: Base
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Stage 2: Production dependencies
FROM base AS dependencies

# Install only production dependencies
RUN npm ci --only=production

# Stage 3: Production
FROM base AS production

# Set environment to production
ENV NODE_ENV=production

# Copy production dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly (for graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

# Start the application (use node instead of nodemon for production)
CMD ["node", "index.js"]
