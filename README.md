<div align="center">
  <h1>Notes on a Quieter Life</h1>
  <p>A personal blog template — essays, photography, and a projects lab.</p>
  <p>
    <a href="#quick-start">Quick Start</a> ·
    <a href="#environment">Environment</a> ·
    <a href="#scripts">Scripts</a> ·
    <a href="#content">Content &amp; Admin</a> ·
    <a href="#deploy">Deploy</a>
  </p>
</div>

A modern personal blog with a Markdown-file content engine, a full admin panel, media-rich article rendering, and zero database dependencies. Everything you write is just files in your repo.

## Features

- **File-based CMS** — articles, lab projects and photos live as Markdown + frontmatter under `src/content/`; git-friendly, no database.
- **Immersive reading** — parallax hero, reading progress bar, prev/next and related-article recommendations.
- **Rich media** — images (3 sizes + lightbox), YouTube/Vimeo/direct video, SoundCloud/direct audio, styled blockquotes via simple Markdown syntax.
- **Admin panel** (`/admin`) — password auth, CRUD for articles / projects / photos, tag suggestions, live Markdown preview, media upload with progress and **automatic image compression** (sharp: max 2048px, quality 82, EXIF orientation fix).
- **Draft workflow** — drafts are private (404 to anonymous visitors) and previewable by logged-in editors.
- **SEO** — per-page meta/OG tags, dynamic `/rss.xml`, `/sitemap.xml`, `/robots.txt`, local favicon & OG image, cover preload.
- **Performance** — route-level code splitting + manual vendor chunks (main bundle ~7 kB), lazy images.
- **Security** — slug whitelist (path-traversal safe), mandatory `ADMIN_PASSWORD`, CORS allowlist, no client-side secrets.

## Tech Stack

Vite 6 · React 19 · React Router 7 · Tailwind CSS 4 · Motion · react-markdown · Express 5 (API) · sharp (image pipeline) · Playwright (e2e)

## Quick Start

```bash
# 1. install dependencies
npm install

# 2. configure environment (create .env.local or set in shell)
export ADMIN_PASSWORD=change-me-please
export SITE_URL=https://yourdomain.com      # optional, defaults to https://franklinhuang.com

# 3. start API server (port 3001) + Vite dev server (port 3000)
npm run dev:full
# open http://localhost:3000

# or run production mode against the built dist/
npm run build
npm run server      # serves dist/ + API on http://localhost:3001
```

## Environment

| Variable | Required | Default | Description |
|---|---|---|---|
| `ADMIN_PASSWORD` | **yes** | — | Admin login password. The server **refuses to start** without it. |
| `API_PORT` | no | `3001` | Port for the Express API/static server. |
| `SITE_URL` | no | `https://franklinhuang.com` | Canonical origin used by `/rss.xml`, `/sitemap.xml`, `/robots.txt`. |
| `DISABLE_HMR` | no | — | Set to `true` to disable Vite HMR (AI Studio hosting). |

> The old `GEMINI_API_KEY` injection was removed — no secrets are ever bundled into the client.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server on :3000 (API proxied to :3001) |
| `npm run server` | Express server: API + built `dist/` on :3001 |
| `npm run dev:full` | Both together (POSIX shells) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Vite preview of the build |
| `npm run lint` | `tsc --noEmit` + ESLint (zero warnings allowed) |
| `npm run format` | Prettier formatting for source files |
| `npm run test:e2e` | Playwright smoke tests (starts its own server on :3210) |
| `npm run clean` | Remove `dist/` |

## Content & Admin

### Writing content (Markdown)

All content is plain files — edit them directly, or use the admin UI.

```
src/content/
├── articles/   # blog posts: frontmatter + Markdown body
├── lab/        # project cards (no body needed)
└── photos/     # photo entries: src / alt / caption / width / height
```

Article frontmatter:

```yaml
---
title: My Post
excerpt: One-line summary used in cards & SEO
coverImage: /uploads/cover.jpg   # or any https URL
date: October 12, 2023
readTime: 5 min read
tags: [Travel, Photography]
status: published                 # published | draft
---
```

Media syntax inside the body:

```md
![alt text](image-url "wide")          # default | wide | full
![Video title](video-url "video")
![Audio title](audio-url "audio")

> A beautiful quote
> — Author Name
```

### Admin panel

1. Visit `/admin`, sign in with `ADMIN_PASSWORD`.
2. Manage **Articles / Lab / Photos** via the tabs.
3. Drafts: set status to *Draft* — anonymous visitors get 404; logged-in editors see a **Preview** (eye) button in the list.
4. Uploads are auto-compressed (JPEG/WebP q82, PNG level 9, GIF preserved) and stored in `public/uploads/`.

## Deploy

Two viable paths — **cloud host / container (recommended)** and **static hosting with API adapters**. Full instructions, Nginx + HTTPS setup, backup strategy and a go-live checklist are in **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

## Project Structure

```
├── server.mjs            # Express API: auth, CRUD, uploads, SEO, static
├── vite.config.ts        # Vite + Tailwind + manualChunks
├── src/
│   ├── content/          # Markdown content (single source of truth)
│   ├── data/             # generated index files + site config
│   ├── pages/            # route components
│   ├── components/       # UI + admin editors
│   ├── context/          # auth state
│   └── main.tsx / App.tsx
├── e2e/                  # Playwright smoke tests
└── optimize-assets.mjs   # one-off: compress legacy uploads
```

## Testing

```bash
npm run test:e2e
```

Covers: homepage render, article page (progress bar / nav), 404 redirect, SEO assets, and the full admin flow (login → create draft → preview → delete). Playwright boots its own server on port 3210 with `ADMIN_PASSWORD=e2e-admin-pw-2026`.
