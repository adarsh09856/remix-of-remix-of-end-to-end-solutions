# Multi-stage production build for TakinMart E-Commerce
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with caching
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build standalone node-server
COPY . .
ENV NITRO_PRESET=node-server
RUN npm run build

# Lean production runtime image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built application output
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
