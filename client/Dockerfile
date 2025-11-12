# Frontend Dockerfile for Talk Talk Goose
# Multi-stage build: Build React app → Serve with nginx

# Stage 1: Build the React application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_GEMINI_API_KEY
ARG VITE_IMAGE_KIT_ENDPOINT
ARG VITE_IMAGE_KIT_PUBLIC_KEY
ARG VITE_API_URL

# Set environment variables for build
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_IMAGE_KIT_ENDPOINT=$VITE_IMAGE_KIT_ENDPOINT
ENV VITE_IMAGE_KIT_PUBLIC_KEY=$VITE_IMAGE_KIT_PUBLIC_KEY
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Expose port 80
EXPOSE 80

# nginx runs as daemon off by default in this image
CMD ["nginx", "-g", "daemon off;"]
