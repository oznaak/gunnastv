# GunnasTV Production Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY backend/package*.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm install --omit=dev

# Copy application code
WORKDIR /app
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Remove old/deprecated files
RUN rm -f frontend/*-old.* 2>/dev/null || true

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Start the server
CMD ["node", "server.js"]
