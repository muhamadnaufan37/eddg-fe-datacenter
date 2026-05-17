#!/bin/bash
set -e

DOMAIN="${DOMAIN:-datacenter.digitaldatagenerus.com}"
EMAIL="${EMAIL:-admin@digitaldatagenerus.com}"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

echo "[INFO] Starting Docker entrypoint..."
echo "[INFO] Domain: $DOMAIN"

# Start Nginx in background (needed for certbot validation)
echo "[INFO] Starting Nginx in background..."
nginx &
NGINX_PID=$!

# Wait for Nginx to start
sleep 2

# Check if certificate exists
if [ ! -d "$CERT_PATH" ]; then
    echo "[INFO] Certificate not found. Requesting from Let's Encrypt..."
    
    certbot certonly \
        --webroot \
        --webroot-path /var/www/certbot \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --domain "$DOMAIN" \
        --rsa-key-size 2048
    
    if [ $? -eq 0 ]; then
        echo "[SUCCESS] Certificate obtained successfully!"
    else
        echo "[WARNING] Certificate request failed. Continuing with Nginx..."
    fi
else
    echo "[INFO] Certificate found at $CERT_PATH"
fi

# Kill background Nginx process
kill $NGINX_PID 2>/dev/null || true
wait $NGINX_PID 2>/dev/null || true

# Start certbot renewal cron service
echo "[INFO] Setting up certificate renewal cron..."
dcron -f &
CRON_PID=$!

# Add renewal job (check daily at 2 AM)
echo "0 2 * * * certbot renew --quiet && nginx -s reload" | crontab -

# Start Nginx in foreground
echo "[INFO] Starting Nginx in foreground..."
exec nginx -g "daemon off;"
