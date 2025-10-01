# Base image
FROM node:18-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy over files and install dependencies
COPY . .
RUN pnpm install

# Build the app
RUN pnpm run build

# Prepare for production
FROM base AS runner
WORKDIR /app

# Create nextjs user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create necessary directories with proper permissions
RUN mkdir -p /app/.next/cache/images && chown -R nextjs:nodejs /app/.next

# Set the user
USER nextjs

# Copy the app files from deps stage
COPY --from=deps /app ./

# Start the app
CMD ["pnpm", "start"]

