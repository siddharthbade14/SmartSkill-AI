# ==========================================
# SmartSkill AI - Frontend Production Dockerfile
# Multi-stage Build: Node 22 Build -> Nginx Alpine Runtime
# ==========================================

# Stage 1: Build static React bundle
FROM node:22-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve static SPA with Nginx
FROM nginx:alpine as runner

# Remove default nginx configurations
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production bundle from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
