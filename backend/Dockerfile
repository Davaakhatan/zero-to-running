# Backend Dockerfile (Fastify)
FROM node:20-alpine

# Install Docker CLI, kubectl, and pnpm (support both Docker and Kubernetes)
RUN apk add --no-cache docker-cli curl && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/ && \
    corepack enable && corepack prepare pnpm@latest --activate

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

