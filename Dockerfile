FROM node:20 AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

RUN rm -f .env.local .env.development .env.development.local
RUN test -f .env.production || (echo "Missing .env.production" && exit 1)

RUN npm run build

FROM nginx:alpine AS runner

RUN apk --no-cache add tzdata
ENV TZ=Asia/Shanghai
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]