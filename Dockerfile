FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build 

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy your custom Nginx configuration file
COPY nginx-custom.conf /etc/nginx/conf.d/default.conf

# Install certbot for Let's Encrypt SSL automation
RUN apk add --no-cache certbot certbot-nginx bash dcron

# Copy entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
