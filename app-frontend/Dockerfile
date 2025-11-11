FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Set build-time environment variable for Next.js
ARG NEXT_PUBLIC_API_URL=http://localhost:3003
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the application
RUN pnpm build

# Development stage (for Docker Compose)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=development
ENV NEXT_PUBLIC_API_URL=http://localhost:3003

# Install pnpm in runner stage
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

EXPOSE 3000

# Use pnpm dev for development mode
CMD ["pnpm", "dev"]

