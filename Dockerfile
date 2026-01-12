FROM node:20 AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

RUN rm -f .env.local .env.development .env.development.local
RUN test -f .env.production || (echo "Missing .env.production" && exit 1)

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

RUN npm install --omit=dev

EXPOSE 3000
CMD ["npm", "start"]