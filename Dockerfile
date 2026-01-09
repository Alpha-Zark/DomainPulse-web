# ---------- Build Stage ----------
FROM node:20 AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./

# 安装所有依赖（包括devDependencies，构建需要）
RUN npm ci

# 复制源码和配置文件
COPY . .

# 确保环境文件存在
RUN test -f .env.staging || (echo "Error: .env.staging file not found" && exit 1)

# 构建并导出静态文件到 out/
RUN npm run build

# ---------- Run Stage ----------
FROM nginx:alpine

# 拷贝静态文件到 nginx 默认目录
COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]