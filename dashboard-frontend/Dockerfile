# Frontend Dockerfile (Next.js)
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy only necessary files for build
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY hooks ./hooks
COPY public ./public
COPY styles ./styles
COPY next.config.mjs ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY components.json ./

# Set build-time environment variable for Next.js
ARG NEXT_PUBLIC_API_URL=http://localhost:3003
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm in runner stage
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built application
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/next.config.mjs ./next.config.mjs

# Expose port (dashboard runs on 3000 inside container, mapped to 3001 on host)
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]

