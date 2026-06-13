# about-me-ai API PM2 部署文档

本文档用于把 `apps/api` 服务部署到云服务器 `117.72.118.82`，并通过公网路径 `http://117.72.118.82/api/about-me-ai` 暴露接口。

## 部署目标

- 代码目录：`/opt/www/about-me-ai`
- 前端静态资源目录：`/opt/www/about-me-ai/apps/web/dist`
- Node.js：`20.19.0` 或更高版本
- 包管理器：`pnpm`
- 进程管理：`pm2`
- 反向代理：`nginx`
- API 本机监听：`127.0.0.1:4000`
- 公网访问前缀：`/api/about-me-ai`
- 前端公网入口：预留根路径 `/`

当前 API 内部路由是 `POST /api/chat`。部署后建议通过 Nginx 去掉 `/api/about-me-ai` 前缀再转发，因此公网接口为：

```text
POST http://117.72.118.82/api/about-me-ai/chat
```

## 方案说明

推荐使用 `Nginx + PM2 + Node.js`：

- PM2 只负责在服务器本机启动和守护 `apps/api` 服务。
- Nginx 负责公网入口、前端静态资源、API 路径前缀转发、SSE 流式响应配置，以及隐藏 Node.js 服务端口。
- 不修改现有 Nest 路由，避免把部署路径耦合进业务代码。
- 前端预留在根路径 `/`，后续执行 `pnpm --filter @about-me-ai/web build` 后即可由 Nginx 托管 `apps/web/dist`。

## 服务器初始化

以下命令在服务器上执行。

```bash
ssh root@117.72.118.82
```

更新系统包。CentOS 7 常用 `yum`，CentOS 8/Stream 常用 `dnf`，下面以 `yum` 为例：

```bash
yum update -y
```

安装基础工具：

```bash
yum install -y git curl nginx
systemctl enable nginx
systemctl start nginx
```

安装 Node.js 20。任选一种方式即可，推荐使用 `nvm`，方便后续升级：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v
```

启用 `pnpm`：

```bash
corepack enable
corepack prepare pnpm@10.32.1 --activate
pnpm -v
```

安装 PM2：

```bash
npm install -g pm2
pm2 -v
```

## 拉取代码

创建部署目录：

```bash
mkdir -p /opt/www
cd /opt/www
git clone <你的仓库地址> about-me-ai
cd /opt/www/about-me-ai
```

如果服务器上已经有代码目录，使用：

```bash
cd /opt/www/about-me-ai
git pull
```

## 配置环境变量

项目会从仓库根目录 `.env` 读取 API 环境变量。

```bash
cd /opt/www/about-me-ai
nano .env
```

建议最小配置如下：

```bash
API_PORT=4000
WEB_ORIGIN=http://117.72.118.82,http://localhost:3000
TRUST_PROXY_HEADERS=true

# 按你的 OpenAI 兼容 LLM 服务实际配置填写
OPENAI_COMPAT_API_KEY=替换为你的密钥
OPENAI_COMPAT_BASE_URL=https://api.openai.com/v1
OPENAI_COMPAT_MODEL=替换为你的模型名称
OPENAI_COMPAT_MAX_TOKENS=600
```

注意：

- 不要把 `.env` 提交到 Git。
- `TRUST_PROXY_HEADERS=true` 用于让限流逻辑优先识别 Nginx 传来的真实客户端 IP。
- `WEB_ORIGIN` 支持逗号分隔的多个来源；如果需要本地 Web 直连服务器 API，保留 `http://localhost:3000`。
- 如果前端将来换成域名，记得同步更新 `WEB_ORIGIN`。

## 安装依赖与构建

在项目根目录执行：

```bash
cd /opt/www/about-me-ai
pnpm install --frozen-lockfile
pnpm --filter @about-me-ai/api build
```

构建产物会生成在：

```text
apps/api/dist
```

如果需要同时预构建前端，可以额外执行：

```bash
pnpm --filter @about-me-ai/web build
```

前端构建产物默认生成在：

```text
apps/web/dist
```

当前 Nginx 配置已经把根路径 `/` 预留给该目录；如果暂时不部署前端，不影响 `/api/about-me-ai` 下的 API 访问。

如果本次只部署 API，也建议先创建一个前端占位页，避免访问根路径时没有明确响应：

```bash
mkdir -p apps/web/dist
cat > apps/web/dist/index.html <<'EOF'
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>About Me AI</title>
  </head>
  <body>
    <h1>About Me AI</h1>
    <p>Frontend is reserved. API is available under /api/about-me-ai.</p>
  </body>
</html>
EOF
```

## 使用 PM2 启动 API

首次启动：

```bash
cd /opt/www/about-me-ai
pm2 start apps/api/dist/main.js \
  --name about-me-ai-api \
  --cwd /opt/www/about-me-ai \
  --time
```

查看状态和日志：

```bash
pm2 status
pm2 logs about-me-ai-api
```

设置 PM2 开机自启：

```bash
pm2 save
pm2 startup
```

`pm2 startup` 会输出一条需要再次执行的命令，复制它并执行一次。执行完成后再次运行：

```bash
pm2 save
```

## 配置 Nginx 反向代理

CentOS 的 Nginx 通常没有 `sites-available/` 和 `sites-enabled/` 目录，而是直接读取 `/etc/nginx/conf.d/*.conf`。

新增 Nginx 配置：

```bash
nano /etc/nginx/conf.d/about-me-ai-api.conf
```

写入以下内容：

```nginx
server {
    listen 80;
    server_name 117.72.118.82;

    root /opt/www/about-me-ai/apps/web/dist;
    index index.html;

    location /api/about-me-ai/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location = /api/about-me-ai {
        return 301 /api/about-me-ai/;
    }

    # 前端预留入口：构建 apps/web 后，根路径会返回前端页面。
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

检查并重载配置：

```bash
nginx -t
systemctl reload nginx
```

如果 `nginx -t` 提示 `server_name` 冲突，先检查已有配置：

```bash
ls /etc/nginx/conf.d
ls /etc/nginx/default.d
```

必要时编辑或移除冲突的默认配置文件，然后重新检查并重载：

```bash
nginx -t
systemctl reload nginx
```

## 验证部署

先在服务器本机验证 Node 服务：

```bash
curl -i -X POST http://127.0.0.1:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"你的联系方式是什么？"}'
```

再验证公网代理：

```bash
curl -i -X POST http://117.72.118.82/api/about-me-ai/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"你的联系方式是什么？"}'
```

成功时应看到 `Content-Type: text/event-stream`，响应体会以 SSE 格式返回：

```text
data: {"type":"status","message":"正在分析问题"}
data: {"type":"status","message":"正在匹配简历经历"}
data: {"type":"status","message":"正在组织回答"}
```

## 后续更新发布

每次更新代码后，在服务器执行：

```bash
cd /opt/www/about-me-ai
git pull
pnpm install --frozen-lockfile
pnpm --filter @about-me-ai/api build
pm2 restart about-me-ai-api --update-env
pm2 save
```

如果本次也更新前端，增加前端构建命令：

```bash
pnpm --filter @about-me-ai/web build
systemctl reload nginx
```

验证：

```bash
pm2 status
curl -i -X POST http://117.72.118.82/api/about-me-ai/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"请简单介绍一下你"}'
```

## 常用运维命令

查看进程：

```bash
pm2 status
```

查看日志：

```bash
pm2 logs about-me-ai-api
```

重启服务：

```bash
pm2 restart about-me-ai-api --update-env
```

停止服务：

```bash
pm2 stop about-me-ai-api
```

删除 PM2 进程：

```bash
pm2 delete about-me-ai-api
```

检查 Nginx 配置：

```bash
nginx -t
```

重载 Nginx：

```bash
systemctl reload nginx
```

## 防火墙检查

如果云服务器启用了 `firewalld`，放行 HTTP：

```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --reload
firewall-cmd --list-all
```

同时确认云厂商安全组已放行入站 `80` 端口。

## 排障

### 本机 4000 端口连接被拒绝

如果执行本机验证时出现：

```text
curl: (7) Failed to connect to 127.0.0.1 port 4000: Connection refused
```

说明 API 服务没有在 `4000` 端口监听。先检查 PM2 进程：

```bash
pm2 status
pm2 logs about-me-ai-api --lines 100
```

再检查端口监听：

```bash
ss -lntp | grep 4000
```

如果 PM2 中没有 `about-me-ai-api`，重新启动：

```bash
cd /opt/www/about-me-ai
pnpm --filter @about-me-ai/api build
pm2 start apps/api/dist/main.js \
  --name about-me-ai-api \
  --cwd /opt/www/about-me-ai \
  --time
```

如果 PM2 状态是 `errored` 或反复重启，优先看日志里的第一条错误。常见原因包括：

- 没有执行 `pnpm install --frozen-lockfile`
- 没有执行 `pnpm --filter @about-me-ai/api build`
- `.env` 不在 `/opt/www/about-me-ai/.env`
- `API_PORT` 不是 `4000`
- 当前 Node.js 版本低于 `20.19.0`

如果 `.env` 里配置了其他端口，例如 `API_PORT=4100`，本机验证命令也要同步改成对应端口：

```bash
curl -i -X POST http://127.0.0.1:4100/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"你是谁？"}'
```

### 访问 502 Bad Gateway

检查 PM2 进程是否在线：

```bash
pm2 status
pm2 logs about-me-ai-api
```

检查本机接口是否可访问：

```bash
curl -i -X POST http://127.0.0.1:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"test"}'
```

### 公网路径返回 404

确认 Nginx 配置中的 `proxy_pass` 是：

```nginx
proxy_pass http://127.0.0.1:4000/api/;
```

这个配置会把公网 `/api/about-me-ai/chat` 转发为本机 `/api/chat`。

### SSE 响应被一次性返回或长时间无输出

确认 Nginx location 中包含：

```nginx
proxy_buffering off;
proxy_cache off;
proxy_read_timeout 300s;
```

### 环境变量不生效

确认 `.env` 位于仓库根目录：

```text
/opt/www/about-me-ai/.env
```

修改 `.env` 后需要重启：

```bash
pm2 restart about-me-ai-api --update-env
```

### 真实客户端 IP 不准确

确认 `.env` 中有：

```bash
TRUST_PROXY_HEADERS=true
```

并确认 Nginx 传递了：

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Real-IP $remote_addr;
```
