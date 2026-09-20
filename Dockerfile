# syntax=docker/dockerfile:1

# ------------------------------------------------------------------
# 1) Závislosti
# ------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------------
# 2) Build
# ------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Adresy obou webů se do buildu zapékají, protože proměnné s prefixem
# NEXT_PUBLIC_ Next dosazuje už při kompilaci. Test a produkce proto mají
# vlastní image - viz src/lib/site-config.ts.
ARG NEXT_PUBLIC_SITE_URL=https://jabcore.cz
ARG NEXT_PUBLIC_PORTFOLIO_URL=https://portfolio.jabcore.cz
ARG NEXT_PUBLIC_SITE_ENV=production
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_PORTFOLIO_URL=$NEXT_PUBLIC_PORTFOLIO_URL
ENV NEXT_PUBLIC_SITE_ENV=$NEXT_PUBLIC_SITE_ENV
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ------------------------------------------------------------------
# 2b) Migrátor - jednorázový kontejner, který pustí build.sh před startem webu
# ------------------------------------------------------------------
# Runtime image níž je Next standalone: nese jen to, co server opravdu
# importuje, takže v něm není ani tsx, ani drizzle-kit, ani src/. Migrace proto
# běží z vlastní vrstvy s kompletními node_modules. Je to obraz navíc, ale
# nesestavuje se při každém requestu - spustí se jednou za deploy a zmizí.
FROM node:22-alpine AS migrator
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json drizzle.config.ts ./
COPY src/db ./src/db
# create-admin.ts sahá na src/lib/auth/password.ts - bez něj skončí na
# "Cannot find module" až uvnitř kontejneru.
COPY src/lib ./src/lib
CMD ["npx", "tsx", "src/db/migrate.ts"]

# ------------------------------------------------------------------
# 3) Runtime
# ------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# wget kvůli healthchecku, tini kvůli korektnímu ukončování procesu
RUN apk add --no-cache tini wget \
 && addgroup -g 1001 -S nodejs \
 && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Nahrané obrázky referencí. Mountuje se sem volume, takže přežijí redeploy.
# Záměrně MIMO public/ - ten je součástí image, takže cokoliv se do něj zapíše
# za běhu zmizí s příštím nasazením. Servíruje je route /uploads.
ENV UPLOADS_DIR=/app/uploads
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
