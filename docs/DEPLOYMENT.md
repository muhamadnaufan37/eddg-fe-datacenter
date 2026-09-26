# Deployment Guide - SSL/TLS dengan Let's Encrypt

## Prerequisites

- Domain sudah di-setup dan pointing ke server IP
- Docker dan Docker Compose sudah terinstall
- Port 80 dan 443 terbuka di firewall

## Deployment Steps

### 1. Clone/pull repository

```bash
cd /path/to/eddg-data-center
git pull origin main  # atau sesuaikan branch
```

### 2. Build Docker image

```bash
docker compose build --no-cache
```

### 3. Deploy (first time - certificate will be generated)

```bash
docker compose up -d
```

Pada run pertama:

- Nginx akan start di port 80
- Script entrypoint akan request certificate dari Let's Encrypt
- Jika berhasil, Nginx akan restart dan listen pada port 443 (HTTPS)
- Certificate akan di-mount ke volume `letsencrypt-data`

### 4. Verify deployment

```bash
# Cek status container
docker compose ps

# Cek logs
docker compose logs -f web

# Test HTTPS (tunggu ~1 menit setelah deploy)
curl -I https://datacenter.digitaldatagenerus.com/
# Output harus: HTTP/2 200 (atau 301 redirect)

# Verify certificate
openssl s_client -connect datacenter.digitaldatagenerus.com:443
```

### 5. Automatic renewal

Let's Encrypt certificate berlaku 90 hari. Script entrypoint sudah setup:

- Cron job yang cek renewal setiap hari jam 02:00 UTC
- Automatic renewal 30 hari sebelum expiry
- Nginx auto-reload setelah renewal sukses

## Troubleshooting

### Certificate request failed

```bash
# Lihat error detail
docker compose logs web | grep certbot

# Manual renewal (masuk container)
docker exec -it <container_id> \
  certbot renew --verbose

# atau issue baru
docker exec -it <container_id> \
  certbot certonly --force-renewal -d datacenter.digitaldatagenerus.com
```

### Port 80/443 sudah terpakai

```bash
# Cari process yang pakai port
sudo lsof -i :80
sudo lsof -i :443

# Kill process atau ubah port di docker-compose.yml
# Contoh: 8000:80 untuk map port 8000 ke container port 80
```

### Nginx config error

```bash
# Test config
docker exec -it <container_id> nginx -t

# Reload nginx setelah fix
docker exec -it <container_id> nginx -s reload
```

## Environment Variables

Set di `.env` file atau docker-compose.yml:

```env
DOMAIN=datacenter.digitaldatagenerus.com
EMAIL=admin@digitaldatagenerus.com
```

## Update aplikasi

```bash
# Pull changes
git pull origin main

# Rebuild dan redeploy
docker compose build --no-cache
docker compose up -d
```

Nginx akan tetap serve HTTPS tanpa perlu re-request certificate.

## SSL/TLS Info

- Protocol: TLSv1.2 + TLSv1.3
- Auto-redirect HTTP → HTTPS
- HSTS headers recommended (tambah di nginx.conf jika perlu)
- Certificate renewal: automatic, 30 hari sebelum expiry
- Certbot using: webroot validation

## Important Notes

- ⚠️ Domain harus sudah pointing ke server IP sebelum deploy
- ⚠️ Firewall harus allow port 80 (untuk ACME validation) dan 443 (HTTPS)
- ✅ Setelah certificate valid, port 80 otomatis redirect ke 443
- ✅ Certificate disimpan di volume Docker, tidak perlu backup manual
