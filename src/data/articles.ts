import siteAuthorData from "./site-author.json";

export interface Author {
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

export const defaultAuthor: Author = siteAuthorData as Author;

export const articles: Article[] = [
  {
    id: "the-art-of-slow-travel",
    slug: "the-art-of-slow-travel",
    title: "Study Notes: Circadian Rhythms, Melatonin, and Sleep Regulation",
    excerpt: "This study guide integrates findings from multiple pivotal papers to analyze the mechanisms of circadian phototransduction, wavelength-dependent physiological effects, the impact of ocular aging, clinical applications of light therapy, and downstream molecular pathways governing cognitive function and glymphatic clearance.",
    coverImage: "/media/c57bd7e5-071b-4421-a39d-0b1416024a7f.png",
    date: "September 28, 2025",
    readTime: "15 min read",
    author: defaultAuthor,
    tags: ["Melatonin", "Sleep Regulation", "Circadian Rhythms"],
    status: "published",
    contentFile: "the-art-of-slow-travel.md",
  },
  {
    id: "analog-photography-digital-age",
    slug: "analog-photography-digital-age",
    title: "The Non-Melatonin-Mediated Physiological and Cognitive Effects of Light on the Human Sleep-Wake Cycle: A Quantitative Experimental Synthesis",
    excerpt: "This study note summarizes the direct, non-melatonin-mediated (or parallel) physiological and cognitive effects of light on the human sleep-wake cycle and alertness. While melatonin suppression is a major marker of circadian phototransduction, ocular light exposure also triggers acute arousal, thermoregulatory changes, cardiovascular acceleration, and cognitive performance enhancement via distinct pathways that can bypass or act independently of melatonin.",
    coverImage: "/media/bc3faf65-9c49-4587-b2f8-86e8f917d91e.png",
    date: "2025-08-26",
    readTime: "15 min read",
    author: defaultAuthor,
    tags: ["brain booster", "light"],
    status: "published",
    contentFile: "analog-photography-digital-age.md",
  }
];

/** Published articles only — for public-facing pages */
export const publishedArticles: Article[] = articles.filter(a => a.status !== "draft");
