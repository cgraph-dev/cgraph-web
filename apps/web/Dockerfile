# CGraph Web — CI Dockerfile
# Build context: repository root.
# The web app depends on workspace packages, so this image installs from the
# monorepo lockfile and builds the @cgraph/web workspace in place.

FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter @cgraph/web...

COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN pnpm run build

FROM nginx:1.27-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# SPA fallback + origin-level security headers (defense-in-depth)
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  add_header X-Content-Type-Options nosniff always;\n\
  add_header X-Frame-Options DENY always;\n\
  add_header Referrer-Policy strict-origin-when-cross-origin always;\n\
  location / { try_files $uri $uri/ /index.html; }\n\
}' > /etc/nginx/conf.d/default.conf

# Security: run as non-root
USER nginx

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
