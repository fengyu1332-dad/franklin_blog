// One-off regen: re-read all md frontmatter and regenerate src/data/articles.ts
// using the same shape server.mjs uses, so per-article author overrides land.
//
// Usage: node regen-articles.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, "src", "content", "articles");
const ARTICLES_TS = path.join(__dirname, "src", "data", "articles.ts");

function listArticles({ includeDrafts = false } = {}) {
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
        author: data.author ?? null,
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
    author: ${a.author ? JSON.stringify(a.author) : "defaultAuthor"},
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

const articles = listArticles();
generateArticlesTs(articles);
console.log(`Regenerated ${ARTICLES_TS} with ${articles.length} articles.`);
for (const a of articles) {
  const avatar = a.author?.avatar ?? "(default)";
  console.log(`  - ${a.slug}: avatar=${avatar}`);
}