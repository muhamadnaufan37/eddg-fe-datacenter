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
