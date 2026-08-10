import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, "src", "content", "articles");
const ARTICLES_TS = path.join(__dirname, "src", "data", "articles.ts");
const UPLOADS_DIR = path.join(__dirname, "public", "uploads");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const TOKEN_SECRET = crypto.randomBytes(32).toString("hex");
const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

const app = express();
app.use(cors());
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

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "video/mp4", "video/webm", "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];
const BLOCKED_EXTENSIONS = [".js", ".html", ".php", ".exe", ".sh", ".bat", ".cmd", ".ps1", ".dll", ".wasm"];

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

app.post("/api/upload", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, size: req.file.size });
});

// ─── Helpers ───

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
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
  avatar: "/uploads/avatar.png",
  bio: "A high school student captivated by engineering, physics, and the natural world. Building things, asking why, and learning out loud.",
  twitter: "@franklinhuang",
  instagram: "@franklin.captures"
}`;

  const items = articles
    .map(
      (a) => `  {
    id: "${a.id}",
    slug: "${a.slug}",
    title: "${a.title.replace(/"/g, '\\"')}",
    excerpt: "${a.excerpt.replace(/"/g, '\\"')}",
    coverImage: "${a.coverImage}",
    date: "${a.date}",
    readTime: "${a.readTime}",
    author: defaultAuthor,
    tags: [${a.tags.map((t) => `"${t}"`).join(", ")}],
    status: "${a.status || "published"}",
    contentFile: "${a.contentFile}",
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
app.get("/api/articles/:slug", (req, res) => {
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
app.delete("/api/uploads/:filename", requireAuth, (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  if (!filePath.startsWith(UPLOADS_DIR)) return res.status(400).json({ error: "Invalid path" });
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
app.put("/api/articles/:slug", requireAuth, (req, res) => {
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
app.delete("/api/articles/:slug", requireAuth, (req, res) => {
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
    id: "${p.id}",
    slug: "${p.slug}",
    title: "${p.title.replace(/"/g, '\\"')}",
    description: "${p.description.replace(/"/g, '\\"')}",
    image: "${p.image}",
    date: "${p.date || ""}",
    tags: [${p.tags.map((t) => `"${t}"`).join(", ")}],
    url: "${p.url}",
    source: "${p.source}",
    status: "${p.status || "draft"}",
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

app.get("/api/lab/:slug", (req, res) => {
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

app.put("/api/lab/:slug", requireAuth, (req, res) => {
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

app.delete("/api/lab/:slug", requireAuth, (req, res) => {
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
      return {
        id: data.id ?? slug,
        slug,
        src: data.src ?? "",
        alt: data.alt ?? "",
        caption: data.caption ?? "",
        width: data.width ?? 800,
        height: data.height ?? 800,
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
    id: "${p.id}",
    slug: "${p.slug}",
    src: "${p.src}",
    alt: "${p.alt.replace(/"/g, '\\"')}",
    caption: "${p.caption.replace(/"/g, '\\"')}",
    width: ${p.width},
    height: ${p.height},
    status: "${p.status || "draft"}",
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

app.get("/api/photos/:slug", (req, res) => {
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

app.put("/api/photos/:slug", requireAuth, (req, res) => {
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

app.delete("/api/photos/:slug", requireAuth, (req, res) => {
  const filePath = path.join(PHOTOS_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  fs.unlinkSync(filePath);

  const photos = listPhotos({ includeDrafts: true });
  generatePhotosTs(photos);

  res.json({ deleted: req.params.slug });
});

// ─── Start ───

const PORT = process.env.API_PORT || 3001;

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
