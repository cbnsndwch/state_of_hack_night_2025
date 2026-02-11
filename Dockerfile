# Dockerfile for Hello Miami Application
# 
# This Dockerfile builds the React Router 7 application with Zero Sync client
# for production deployment.

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Build arguments for environment variables (client-side only, prefixed with VITE_)
ARG VITE_ZERO_CACHE_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET

# Set environment variables for build
ENV VITE_ZERO_CACHE_URL=$VITE_ZERO_CACHE_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME
ENV VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/build ./build

# Expose application port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "build/server/index.js"]
