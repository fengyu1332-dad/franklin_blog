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

const app = express();
app.use(cors());
app.use(express.json());

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

app.post("/api/upload", upload.single("file"), (req, res) => {
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

function listArticles() {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs
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
        contentFile: filename,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function generateArticlesTs(articles) {
  const defaultAuthor = `{
  name: "Jane Doe",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  bio: "Documenting the quiet moments between the noise. A journal of travel, photography, and finding meaning in the everyday.",
  twitter: "@janedoe",
  instagram: "@jane.captures"
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
  /** Markdown filename (without path) loaded from src/content/articles/ */
  contentFile: string;
}

export const defaultAuthor: Author = ${defaultAuthor};

export const articles: Article[] = [
${items}
];
`;
  fs.writeFileSync(ARTICLES_TS, ts, "utf8");
}

// ─── API Routes ───

// List all articles
app.get("/api/articles", (_req, res) => {
  res.json(listArticles());
});

// Get single article
app.get("/api/articles/:slug", (req, res) => {
  const filePath = path.join(ARTICLES_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  res.json({ ...data, slug: req.params.slug, content });
});

// Create article
app.post("/api/articles", (req, res) => {
  const { title, excerpt, coverImage, date, readTime, tags, content } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const slug = slugify(title);
  const filename = `${slug}.md`;
  const filePath = path.join(ARTICLES_DIR, filename);

  if (fs.existsSync(filePath)) {
    return res.status(409).json({ error: "Article with this slug already exists", slug });
  }

  const frontmatter = { title, excerpt: excerpt ?? "", coverImage: coverImage ?? "", date: date ?? "", readTime: readTime ?? "", tags: tags ?? [] };
  const md = matter.stringify(content ?? "", frontmatter);

  if (!fs.existsSync(ARTICLES_DIR)) fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  fs.writeFileSync(filePath, md, "utf8");

  const articles = listArticles();
  generateArticlesTs(articles);

  res.status(201).json({ slug, filename });
});

// Update article
app.put("/api/articles/:slug", (req, res) => {
  const filePath = path.join(ARTICLES_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });

  const { title, excerpt, coverImage, date, readTime, tags, content } = req.body;
  const raw = fs.readFileSync(filePath, "utf8");
  const existing = matter(raw);

  const frontmatter = {
    title: title ?? existing.data.title,
    excerpt: excerpt ?? existing.data.excerpt ?? "",
    coverImage: coverImage ?? existing.data.coverImage ?? "",
    date: date ?? existing.data.date ?? "",
    readTime: readTime ?? existing.data.readTime ?? "",
    tags: tags ?? existing.data.tags ?? [],
  };

  const md = matter.stringify(content ?? existing.content, frontmatter);
  fs.writeFileSync(filePath, md, "utf8");

  const articles = listArticles();
  generateArticlesTs(articles);

  res.json({ slug: req.params.slug });
});

// Delete article
app.delete("/api/articles/:slug", (req, res) => {
  const filePath = path.join(ARTICLES_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });

  fs.unlinkSync(filePath);

  const articles = listArticles();
  generateArticlesTs(articles);

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
