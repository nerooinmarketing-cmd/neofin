FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# chromium: Telegram "Raporlar" PDF üretimi için (bkz. src/server/reports/pdf.ts,
# puppeteer-core + apt'ten kurulan bu ikili — bundled Chromium indirmez).
RUN apt-get update && apt-get install -y --no-install-recommends openssl chromium && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs --home-dir /home/nextjs --create-home nextjs
# node:24-slim'in ENV HOME=/root'u USER nextjs'e geçince de kalıcı olur (Docker
# HOME'u USER değişince otomatik güncellemez) — nextjs kullanıcısının /root'a
# yazma izni yok, bu da Chromium'un crashpad veritabanını kuramamasına ve
# hiç açılamamasına yol açıyordu ("chrome_crashpad_handler: --database is
# required"). Gerçek ev dizinine işaret etmek kalıcı çözüm.
ENV HOME=/home/nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
