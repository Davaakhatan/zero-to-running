# CollabCanva Dockerfile (Vite + React)
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY . .

# Development stage (for hot reload) - NOT USED IN KUBERNETES
FROM base AS runner
WORKDIR /app

# Install wget for health checks
RUN apk add --no-cache wget

# Expose port (Vite dev server runs on 5173, but we'll map to 3002)
EXPOSE 3002

ENV PORT=3002
ENV NODE_ENV=development

# Start the development server
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "3002"]

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# Set build-time environment variables
ARG VITE_API_URL=http://backend-service:3003
ARG VITE_OPENAI_API_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY

# Build the application
RUN pnpm build

# Install serve for production (use npm for global install)
RUN npm install -g serve

# Install wget for health checks
RUN apk add --no-cache wget

# The dist folder is already in /app/dist from the build step above
# No need to copy from base stage since we built it here

# Expose port
EXPOSE 3002

ENV PORT=3002

# Start the application using serve
CMD ["serve", "-s", "dist", "-l", "3002"]

