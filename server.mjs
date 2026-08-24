import express from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import multer from "multer";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, "src", "content", "articles");
const ARTICLES_TS = path.join(__dirname, "src", "data", "articles.ts");
const UPLOADS_DIR = path.join(__dirname, "public", "uploads");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  throw new Error(
    "ADMIN_PASSWORD environment variable is required. " +
    "Set a strong password before starting the server (e.g. ADMIN_PASSWORD=yourpassword node server.mjs)."
  );
}
const TOKEN_SECRET = crypto.randomBytes(32).toString("hex");
const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

const app = express();

// CORS: allow same-origin (including Vite's modulepreload requests, which always
// send an Origin header) and any localhost/127.0.0.1 origin (dev + e2e servers).
// Everything else is rejected with 403.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();
  try {
    const o = new URL(origin);
    const sameOrigin = o.host === (req.headers.host || "");
    const isLocal = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(o.hostname);
    if (sameOrigin || isLocal) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    } else {
      return res.status(403).json({ error: "Not allowed by CORS" });
    }
  } catch {
    return res.status(403).json({ error: "Not allowed by CORS" });
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());

// ─── Auth helpers ───

function createToken() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + TOKEN_TTL })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  try {
    const [payload, sig] = token.split(".");
    const expected = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(payload)
      .digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
      return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!verifyToken(header.slice(7))) {
    return res.status(401).json({ error: "Token expired or invalid" });
  }
  next();
}

// ─── Auth routes ───

app.post("/api/auth/login", (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }
  res.json({ token: createToken() });
});

app.get("/api/auth/check", requireAuth, (_req, res) => {
  res.json({ ok: true });
});

// ─── File Upload ───

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];
const BLOCKED_EXTENSIONS = [".js", ".html", ".php", ".exe", ".sh", ".bat", ".cmd", ".ps1", ".dll", ".wasm"];
const IMAGE_MAX_DIMENSION = 2048; // max width/height for uploaded raster images
const IMAGE_QUALITY = 82;
const UPLOAD_COMPRESS_RETRIES = 6; // BaiduSyncdisk-style sync clients briefly lock new files
const UPLOAD_COMPRESS_RETRY_DELAY_MS = 500;

/** Compress an uploaded raster image in place. The file is read into memory first
 *  (bypassing libvips' direct open, which cloud-sync clients can block), then
 *  compressed and written back over the same path so the URL stays unchanged. */
async function compressUploadedImage(filePath) {
  let lastErr;
  for (let attempt = 0; attempt < UPLOAD_COMPRESS_RETRIES; attempt++) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const buf = fs.readFileSync(filePath);
      const image = sharp(buf).rotate(); // auto-correct EXIF orientation
      const meta = await image.metadata();
      let pipeline = image;
      if ((meta.width ?? 0) > IMAGE_MAX_DIMENSION || (meta.height ?? 0) > IMAGE_MAX_DIMENSION) {
        pipeline = pipeline.resize({
          width: IMAGE_MAX_DIMENSION,
          height: IMAGE_MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        });
      }
      const format = ext === ".png" ? "png" : ext === ".webp" ? "webp" : "jpeg";
      const opts = format === "png" ? { compressionLevel: 9 } : { quality: IMAGE_QUALITY };
      const output = await pipeline.toFormat(format, opts).toBuffer();
      fs.writeFileSync(filePath, output); // overwrite in place, URL unchanged
      return output.length;
    } catch (err) {
      lastErr = err;
      if (attempt < UPLOAD_COMPRESS_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, UPLOAD_COMPRESS_RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const id = crypto.randomUUID();
    cb(null, `${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`File type not allowed: ${ext}`));
    }
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error(`MIME type not allowed: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

app.post("/api/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let finalSize = req.file.size;
    const ext = path.extname(req.file.filename).toLowerCase();

    // Compress raster images in place (URL unchanged). Skip GIF to preserve animation.
    if (req.file.mimetype.startsWith("image/") && ext !== ".gif") {
      try {
        finalSize = await compressUploadedImage(req.file.path);
        console.log(`[upload] compressed ${req.file.originalname}: ${req.file.size} -> ${finalSize} bytes`);
      } catch (compressErr) {
        // Keep the original file if compression fails (e.g. malformed image)
        console.warn("[upload] image compression skipped:", compressErr.message);
      }
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, size: finalSize });
  } catch (err) {
    console.error("[upload] failed:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ─── Helpers ───

/** Unicode-aware slug. Keeps letters/numbers from any language (e.g. Chinese titles). */
function slugify(text) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

/** Slug whitelist: unicode letters/numbers, dash, underscore. Blocks path traversal. */
const SLUG_RE = /^[\p{L}\p{N}_-]+$/u;

function assertValidSlug(req, res, next) {
  const slug = req.params.slug;
  if (!slug || !SLUG_RE.test(slug) || path.basename(slug) !== slug) {
    return res.status(400).json({ error: "Invalid slug" });
  }
  next();
}

function assertValidFilename(req, res, next) {
  const filename = req.params.filename;
  if (!filename || path.basename(filename) !== filename || filename.includes("..")) {
    return res.status(400).json({ error: "Invalid filename" });
  }
  next();
}

function listArticles({ includeDrafts = false } = {}) {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  const all = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, filename), "utf8");
      const { data } = matter(raw);
      const slug = filename.replace(/\.md$/, "");
      return {
        id: data.id ?? slug,
        slug,
        title: data.title ?? slug,
        excerpt: data.excerpt ?? "",
        coverImage: data.coverImage ?? "",
        date: data.date ?? "",
        readTime: data.readTime ?? "",
        tags: data.tags ?? [],
        status: data.status ?? "published",
        contentFile: filename,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return includeDrafts ? all : all.filter((a) => a.status !== "draft");
}

function generateArticlesTs(articles) {
  const defaultAuthor = `{
  name: "Franklin HUANG",
  avatar: "/avatar.png",
  bio: "A high school student captivated by engineering, physics, and the natural world. Building things, asking why, and learning out loud.",
  twitter: "@franklinhuang",
  instagram: "@franklin.captures"
}`;

  const items = articles
    .map(
      (a) => `  {
    id: ${JSON.stringify(a.id)},
    slug: ${JSON.stringify(a.slug)},
    title: ${JSON.stringify(a.title)},
    excerpt: ${JSON.stringify(a.excerpt)},
    coverImage: ${JSON.stringify(a.coverImage)},
    date: ${JSON.stringify(a.date)},
    readTime: ${JSON.stringify(a.readTime)},
    author: defaultAuthor,
    tags: [${a.tags.map((t) => JSON.stringify(t)).join(", ")}],
    status: ${JSON.stringify(a.status || "published")},
    contentFile: ${JSON.stringify(a.contentFile)},
  }`
    )
    .join(",\n");

  const ts = `export interface Author {
  name: string;
  avatar: string;
  bio: string;
  twitter?: string;
  instagram?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  date: string;
  readTime: string;
  author: Author;
  tags: string[];
  status: "published" | "draft";
  /** Markdown filename (without path) loaded from src/content/articles/ */
  contentFile: string;
}

export const defaultAuthor: Author = ${defaultAuthor};

export const articles: Article[] = [
${items}
];

/** Published articles only — for public-facing pages */
export const publishedArticles: Article[] = articles.filter(a => a.status !== "draft");
`;
  fs.writeFileSync(ARTICLES_TS, ts, "utf8");
}

// ─── API Routes ───

// List articles — returns only published for public; include drafts if authed
app.get("/api/articles", (req, res) => {
  const authed =
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ") &&
    verifyToken(req.headers.authorization.slice(7));
  res.json(listArticles({ includeDrafts: authed }));
});

// Get single article — allows draft access if authed
app.get("/api/articles/:slug", assertValidSlug, (req, res) => {
  const filePath = path.join(ARTICLES_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const authed =
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ") &&
    verifyToken(req.headers.authorization.slice(7));

  const article = { ...data, slug: req.params.slug, content, status: data.status ?? "published" };
  // Block draft access for unauthenticated requests
  if (!authed && article.status === "draft") {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(article);
});

// List all tags
app.get("/api/tags", (_req, res) => {
  const articles = listArticles({ includeDrafts: true });
  const tagSet = new Set(articles.flatMap((a) => a.tags));
  res.json([...tagSet].sort());
});

// List uploaded files
app.get("/api/uploads", requireAuth, (_req, res) => {
  if (!fs.existsSync(UPLOADS_DIR)) return res.json([]);
  const files = fs.readdirSync(UPLOADS_DIR).map((name) => ({
    name,
    url: `/uploads/${name}`,
    size: fs.statSync(path.join(UPLOADS_DIR, name)).size,
  }));
  res.json(files);
});

// Delete uploaded file
app.delete("/api/uploads/:filename", requireAuth, assertValidFilename, (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  fs.unlinkSync(filePath);
  res.json({ deleted: req.params.filename });
});

// Create article
app.post("/api/articles", requireAuth, (req, res) => {
  const { title, excerpt, coverImage, date, readTime, tags, content, status } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const slug = slugify(title);
  const filename = `${slug}.md`;
  const filePath = path.join(ARTICLES_DIR, filename);

  if (fs.existsSync(filePath)) {
    return res.status(409).json({ error: "Article with this slug already exists", slug });
  }

  const frontmatter = { title, excerpt: excerpt ?? "", coverImage: coverImage ?? "", date: date ?? "", readTime: readTime ?? "", tags: tags ?? [], status: status ?? "draft" };
  const md = matter.stringify(content ?? "", frontmatter);

  if (!fs.existsSync(ARTICLES_DIR)) fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  fs.writeFileSync(filePath, md, "utf8");

  const articles = listArticles();
  generateArticlesTs(articles);

  res.status(201).json({ slug, filename });
});

// Update article
app.put("/api/articles/:slug", requireAuth, assertValidSlug, (req, res) => {
  const filePath = path.join(ARTICLES_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });

  const { title, excerpt, coverImage, date, readTime, tags, content, status } = req.body;
  const raw = fs.readFileSync(filePath, "utf8");
  const existing = matter(raw);

  const frontmatter = {
    title: title ?? existing.data.title,
    excerpt: excerpt ?? existing.data.excerpt ?? "",
    coverImage: coverImage ?? existing.data.coverImage ?? "",
    date: date ?? existing.data.date ?? "",
    readTime: readTime ?? existing.data.readTime ?? "",
    tags: tags ?? existing.data.tags ?? [],
    status: status ?? existing.data.status ?? "draft",
  };

  const md = matter.stringify(content ?? existing.content, frontmatter);
  fs.writeFileSync(filePath, md, "utf8");

  const articles = listArticles();
  generateArticlesTs(articles);

  res.json({ slug: req.params.slug });
});

// Delete article
app.delete("/api/articles/:slug", requireAuth, assertValidSlug, (req, res) => {
  const filePath = path.join(ARTICLES_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });

  fs.unlinkSync(filePath);

  const articles = listArticles();
  generateArticlesTs(articles);

  res.json({ deleted: req.params.slug });
});

// ─── Lab (projects) ───

const LAB_DIR = path.join(__dirname, "src", "content", "lab");
const LAB_TS = path.join(__dirname, "src", "data", "lab.ts");

function listLabProjects({ includeDrafts = false } = {}) {
  if (!fs.existsSync(LAB_DIR)) return [];
  const all = fs
    .readdirSync(LAB_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(LAB_DIR, filename), "utf8");
      const { data } = matter(raw);
      const slug = filename.replace(/\.md$/, "");
      return {
        id: data.id ?? slug,
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        image: data.image ?? "",
        date: data.date ?? "",
        tags: data.tags ?? [],
        url: data.url ?? "",
        source: data.source ?? "",
        status: data.status ?? "draft",
      };
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return includeDrafts ? all : all.filter((p) => p.status !== "draft");
}

function generateLabTs(projects) {
  const items = projects
    .map(
      (p) => `  {
    id: ${JSON.stringify(p.id)},
    slug: ${JSON.stringify(p.slug)},
    title: ${JSON.stringify(p.title)},
    description: ${JSON.stringify(p.description)},
    image: ${JSON.stringify(p.image)},
    date: ${JSON.stringify(p.date || "")},
    tags: [${p.tags.map((t) => JSON.stringify(t)).join(", ")}],
    url: ${JSON.stringify(p.url)},
    source: ${JSON.stringify(p.source)},
    status: ${JSON.stringify(p.status || "draft")},
  }`
    )
    .join(",\n");

  const ts = `export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  date: string;
  tags: string[];
  url: string;
  source: string;
  status: "published" | "draft";
}

export const projects: Project[] = [
${items}
];

export const publishedProjects: Project[] = projects.filter(p => p.status !== "draft");
`;
  fs.writeFileSync(LAB_TS, ts, "utf8");
}

app.get("/api/lab", (req, res) => {
  const authed =
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ") &&
    verifyToken(req.headers.authorization.slice(7));
  res.json(listLabProjects({ includeDrafts: authed }));
});

app.get("/api/lab/:slug", assertValidSlug, (req, res) => {
  const filePath = path.join(LAB_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = matter(raw);
  res.json({ ...data, slug: req.params.slug });
});

app.post("/api/lab", requireAuth, (req, res) => {
  const { title, description, image, date, tags, url, source, status } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const slug = slugify(title);
  const filename = `${slug}.md`;
  const filePath = path.join(LAB_DIR, filename);

  if (fs.existsSync(filePath)) {
    return res.status(409).json({ error: "Project with this slug already exists", slug });
  }

  const frontmatter = {
    title,
    description: description ?? "",
    image: image ?? "",
    date: date ?? "",
    tags: tags ?? [],
    url: url ?? "",
    source: source ?? "",
    status: status ?? "draft",
  };
  const md = matter.stringify("", frontmatter);

  if (!fs.existsSync(LAB_DIR)) fs.mkdirSync(LAB_DIR, { recursive: true });
  fs.writeFileSync(filePath, md, "utf8");

  const projects = listLabProjects({ includeDrafts: true });
  generateLabTs(projects);

  res.status(201).json({ slug, filename });
});

app.put("/api/lab/:slug", requireAuth, assertValidSlug, (req, res) => {
  const filePath = path.join(LAB_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });

  const { title, description, image, date, tags, url, source, status } = req.body;
  const raw = fs.readFileSync(filePath, "utf8");
  const existing = matter(raw);

  const frontmatter = {
    title: title ?? existing.data.title,
    description: description ?? existing.data.description ?? "",
    image: image ?? existing.data.image ?? "",
    date: date ?? existing.data.date ?? "",
    tags: tags ?? existing.data.tags ?? [],
    url: url ?? existing.data.url ?? "",
    source: source ?? existing.data.source ?? "",
    status: status ?? existing.data.status ?? "draft",
  };

  const md = matter.stringify("", frontmatter);
  fs.writeFileSync(filePath, md, "utf8");

  const projects = listLabProjects({ includeDrafts: true });
  generateLabTs(projects);

  res.json({ slug: req.params.slug });
});

app.delete("/api/lab/:slug", requireAuth, assertValidSlug, (req, res) => {
  const filePath = path.join(LAB_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  fs.unlinkSync(filePath);

  const projects = listLabProjects({ includeDrafts: true });
  generateLabTs(projects);

  res.json({ deleted: req.params.slug });
});

// ─── Photos ───

const PHOTOS_DIR = path.join(__dirname, "src", "content", "photos");
const PHOTOS_TS = path.join(__dirname, "src", "data", "photos.ts");

function listPhotos({ includeDrafts = false } = {}) {
  if (!fs.existsSync(PHOTOS_DIR)) return [];
  const all = fs
    .readdirSync(PHOTOS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(PHOTOS_DIR, filename), "utf8");
      const { data } = matter(raw);
      const slug = filename.replace(/\.md$/, "");
      const src = data.src ?? "";
      // Report real file size for locally-hosted uploads
      let size = null;
      if (typeof src === "string" && src.startsWith("/uploads/")) {
        try {
          const localFile = path.join(UPLOADS_DIR, path.basename(src));
          if (fs.existsSync(localFile)) size = fs.statSync(localFile).size;
        } catch {
          /* non-fatal */
        }
      }
      return {
        id: data.id ?? slug,
        slug,
        src,
        alt: data.alt ?? "",
        caption: data.caption ?? "",
        width: data.width ?? 800,
        height: data.height ?? 800,
        size,
        status: data.status ?? "draft",
      };
    })
    .sort((a, b) => b.slug.localeCompare(a.slug));
  return includeDrafts ? all : all.filter((p) => p.status !== "draft");
}

function generatePhotosTs(photos) {
  const items = photos
    .map(
      (p) => `  {
    id: ${JSON.stringify(p.id)},
    slug: ${JSON.stringify(p.slug)},
    src: ${JSON.stringify(p.src)},
    alt: ${JSON.stringify(p.alt)},
    caption: ${JSON.stringify(p.caption)},
    width: ${p.width},
    height: ${p.height},
    status: ${JSON.stringify(p.status || "draft")},
  }`
    )
    .join(",\n");

  const ts = `export interface Photo {
  id: string;
  slug: string;
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  status: "published" | "draft";
}

export const photos: Photo[] = [
${items}
];

export const publishedPhotos: Photo[] = photos.filter(p => p.status !== "draft");
`;
  fs.writeFileSync(PHOTOS_TS, ts, "utf8");
}

app.get("/api/photos", (req, res) => {
  const authed =
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ") &&
    verifyToken(req.headers.authorization.slice(7));
  res.json(listPhotos({ includeDrafts: authed }));
});

app.get("/api/photos/:slug", assertValidSlug, (req, res) => {
  const filePath = path.join(PHOTOS_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = matter(raw);
  res.json({ ...data, slug: req.params.slug });
});

app.post("/api/photos", requireAuth, (req, res) => {
  const { src, alt, caption, width, height, status } = req.body;
  if (!src) return res.status(400).json({ error: "Image URL is required" });

  const slug = slugify(caption || `photo-${Date.now()}`);
  const filename = `${slug}.md`;
  const filePath = path.join(PHOTOS_DIR, filename);

  if (fs.existsSync(filePath)) {
    return res.status(409).json({ error: "Photo with this slug already exists", slug });
  }

  const frontmatter = {
    src,
    alt: alt ?? "",
    caption: caption ?? "",
    width: width ?? 800,
    height: height ?? 800,
    status: status ?? "draft",
  };
  const md = matter.stringify("", frontmatter);

  if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  fs.writeFileSync(filePath, md, "utf8");

  const photos = listPhotos({ includeDrafts: true });
  generatePhotosTs(photos);

  res.status(201).json({ slug, filename });
});

app.put("/api/photos/:slug", requireAuth, assertValidSlug, (req, res) => {
  const filePath = path.join(PHOTOS_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });

  const { src, alt, caption, width, height, status } = req.body;
  const raw = fs.readFileSync(filePath, "utf8");
  const existing = matter(raw);

  const frontmatter = {
    src: src ?? existing.data.src,
    alt: alt ?? existing.data.alt ?? "",
    caption: caption ?? existing.data.caption ?? "",
    width: width ?? existing.data.width ?? 800,
    height: height ?? existing.data.height ?? 800,
    status: status ?? existing.data.status ?? "draft",
  };

  const md = matter.stringify("", frontmatter);
  fs.writeFileSync(filePath, md, "utf8");

  const photos = listPhotos({ includeDrafts: true });
  generatePhotosTs(photos);

  res.json({ slug: req.params.slug });
});

app.delete("/api/photos/:slug", requireAuth, assertValidSlug, (req, res) => {
  const filePath = path.join(PHOTOS_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  fs.unlinkSync(filePath);

  const photos = listPhotos({ includeDrafts: true });
  generatePhotosTs(photos);

  res.json({ deleted: req.params.slug });
});

// ─── SEO: dynamic RSS / sitemap / robots (registered before static files so they win) ───

const SITE_URL = (process.env.SITE_URL || "https://franklinhuang.com").replace(/\/+$/, "");
const SITE_TITLE = "Notes on a Quieter Life";
const SITE_DESC =
  "Essays, photography, and reflections on finding meaning in the spaces between the noise.";

function xmlEscape(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(dateStr) {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

app.get("/rss.xml", (_req, res) => {
  const items = listArticles()
    .slice(0, 20)
    .map(
      (a) => `
    <item>
      <title>${xmlEscape(a.title)}</title>
      <link>${SITE_URL}/post/${encodeURIComponent(a.slug)}</link>
      <guid>${SITE_URL}/post/${encodeURIComponent(a.slug)}</guid>
      <pubDate>${toRfc822(a.date)}</pubDate>
      <description>${xmlEscape(a.excerpt)}</description>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${xmlEscape(SITE_DESC)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
  res.type("application/rss+xml").send(xml);
});

app.get("/sitemap.xml", (_req, res) => {
  const staticPages = ["", "/about", "/photography", "/archive", "/lab"]
    .map((p) => {
      const priority = p === "" ? "1.0" : p === "/archive" ? "0.8" : "0.7";
      return `
  <url>
    <loc>${SITE_URL}${p}</loc>
    <changefreq>${p === "/archive" ? "weekly" : "monthly"}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("");

  const articleUrls = listArticles()
    .map(
      (a) => `
  <url>
    <loc>${SITE_URL}/post/${encodeURIComponent(a.slug)}</loc>
    <lastmod>${xmlEscape(a.date)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages}
  ${articleUrls}
</urlset>`;
  res.type("application/xml").send(xml);
});

app.get("/robots.txt", (_req, res) => {
  const txt = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${SITE_URL}/sitemap.xml
`;
  res.type("text/plain").send(txt);
});

// ─── Start ───

const PORT = process.env.API_PORT || 3001;

// Serve runtime-uploaded files directly (works in both dev and production).
// Must be registered before the SPA fallback so /uploads/* is never swallowed by index.html.
app.use("/uploads", express.static(UPLOADS_DIR));

// In production, serve built static files
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback: non-/api routes serve index.html
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
