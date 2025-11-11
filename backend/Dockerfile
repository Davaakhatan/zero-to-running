# Backend Dockerfile (Fastify)
FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3003

# Build TypeScript (for production)
RUN pnpm build

# Start the application
CMD ["node", "dist/index.js"]

