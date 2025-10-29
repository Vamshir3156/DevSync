
FROM node:20-slim


RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm install

# Copy sources
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client & build
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Basic healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD node -e "fetch('http://localhost:' + (process.env.PORT||5000) + '/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
