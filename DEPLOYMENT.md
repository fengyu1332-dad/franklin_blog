# Deployment Guide

This project is a **Vite SPA + Express 5 API** (single `server.mjs` that serves both the built frontend and the API in production). It stores content as files, so deployment is straightforward on any Node.js host.

---

## Architecture at a glance

```
Browser ──▶ Nginx (443, HTTPS)
               ├── static assets ──▶ /dist (built frontend)
               └── everything else ──▶ Node (server.mjs, port 3001)
                                          ├── /api/*          CRUD + auth + uploads
                                          ├── /uploads/*      uploaded files
                                          └── /rss.xml, /sitemap.xml, /robots.txt
```

No database. The state you must back up: **`src/content/`** (all written content) and **`public/uploads/`** (media files).

---

## Option A — Cloud host / VPS / container (recommended)

### 1. Build & run

```bash
npm ci
npm run build
ADMIN_PASSWORD='<strong-password>' SITE_URL='https://yourdomain.com' node server.mjs
```

- `ADMIN_PASSWORD` is **mandatory** — the server refuses to start without it.
- `SITE_URL` feeds the RSS/sitemap/robots canonical URLs.
- The server serves `dist/` + API on port `3001` (override with `API_PORT`).

### 2. Run as a service (systemd example)

```ini
# /etc/systemd/system/blog.service
[Unit]
Description=Franklin blog
After=network.target

[Service]
WorkingDirectory=/opt/blog
ExecStart=/usr/bin/node server.mjs
Environment=ADMIN_PASSWORD=CHANGE_ME
Environment=SITE_URL=https://yourdomain.com
Environment=NODE_ENV=production
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now blog
```

### 3. Nginx reverse proxy + HTTPS

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # certbot will fill these in
    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    client_max_body_size 60m;          # allow uploads up to the API's 50MB limit

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo certbot --nginx -d yourdomain.com   # automatic HTTPS + renewal
sudo systemctl reload nginx
```

**Verify:** `curl -I https://yourdomain.com` → 200 · `curl https://yourdomain.com/rss.xml` → XML · `/admin` login works.

### 4. Backup strategy

Content is plain files, so backups are trivial:

```bash
# every night (cron)
cd /opt/blog
git add src/content public/uploads && git commit -m "backup $(date +%F)" && git push
# and/or
tar czf /backup/blog-$(date +%F).tar.gz src/content public/uploads
```

Restore = `git pull` (or extract the tarball) and restart the service.

---

## Option B — Static hosting (Vercel / Netlify / Cloudflare Pages)

The **frontend** deploys as a static site, but the Express API (`server.mjs`) is **not** a serverless function yet. Choices:

1. **Keep the API elsewhere** — host `server.mjs` on a tiny VPS/container (Option A) and configure `VITE_API_ORIGIN`/proxy. Cleanest separation.
2. **Adapt the API** — split routes into `api/*.ts` Vercel functions (or `netlify/functions`). The handlers in `server.mjs` are plain Express middleware, so porting is mechanical but requires a dedicated task.

> ⚠️ With static hosting, `/uploads/*` only contains files present at build time (from `public/uploads/`). Runtime uploads must go to an object store (S3/R2) or a file API on the backend.

---

## Go-live checklist

- [ ] `ADMIN_PASSWORD` set to a strong, unique value — never the default
- [ ] `SITE_URL` matches the real domain
- [ ] Content committed: `src/content/**` and `public/uploads/` are backed up / in git
- [ ] HTTPS enforced (certbot), HSTS enabled if desired
- [ ] `npm run lint` passes
- [ ] `npm run test:e2e` passes
- [ ] Smoke test on the live domain: homepage, one article, `/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/admin` login, image upload
- [ ] `client_max_body_size` large enough for uploads (≥ 60m)
- [ ] Restart policy in place (systemd/PM2/container restart: always)

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Server exits immediately | `ADMIN_PASSWORD` not set — export it and restart |
| Newly uploaded image 404s | The `/uploads` static route is registered — confirm you're on the latest `server.mjs`; static hosts need an object store |
| `/rss.xml` shows wrong domain | Set `SITE_URL` |
| Port in use | Change `API_PORT` or stop the conflicting process |
| Upload returns "File type not allowed" | SVG is intentionally blocked; use JPEG/PNG/WebP/GIF, MP4/WebM, MP3/WAV/OGG |
| Files can't be written on shared/synced disks | Cloud-sync clients (e.g. Baidu SyncDisk) lock files briefly — uploads have built-in retries; for legacy assets run `node optimize-assets.mjs` |
