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

export const defaultAuthor: Author = {
  name: "Franklin HUANG",
  avatar: "/avatar.png",
  bio: "A high school student captivated by engineering, physics, and the natural world. Building things, asking why, and learning out loud.",
  twitter: "@franklinhuang",
  instagram: "@franklin.captures"
};

export const articles: Article[] = [
  {
    id: "the-art-of-slow-travel",
    slug: "the-art-of-slow-travel",
    title: "The Art of Slow Travel: Finding Meaning in the In-Between",
    excerpt: "Why rushing from landmark to landmark is ruining our ability to truly experience the world around us.",
    coverImage: "https://picsum.photos/seed/slowtravel/1600/900",
    date: "October 12, 2023",
    readTime: "8 min read",
    author: {"name":"Franklin HUANG","avatar":"/avatar-portrait.png","bio":"A high school student captivated by engineering, physics, and the natural world. Building things, asking why, and learning out loud.","twitter":"@franklinhuang","instagram":"@franklin.captures"},
    tags: ["Travel", "Mindfulness", "Photography"],
    status: "published",
    contentFile: "the-art-of-slow-travel.md",
  },
  {
    id: "analog-photography-digital-age",
    slug: "analog-photography-digital-age",
    title: "Embracing Analog in a Hyper-Digital Age",
    excerpt: "There is something profoundly grounding about the mechanical click of a shutter and the anticipation of developing film.",
    coverImage: "https://picsum.photos/seed/analog/1600/900",
    date: "September 28, 2023",
    readTime: "5 min read",
    author: defaultAuthor,
    tags: ["Photography", "Culture"],
    status: "published",
    contentFile: "analog-photography-digital-age.md",
  },
  {
    id: "morning-rituals",
    slug: "morning-rituals",
    title: "Morning Rituals That Actually Work",
    excerpt: "Beyond the 5 AM club: finding a morning routine that respects your natural rhythms rather than fighting them.",
    coverImage: "https://picsum.photos/seed/morning/1600/900",
    date: "September 15, 2023",
    readTime: "6 min read",
    author: defaultAuthor,
    tags: ["Lifestyle", "Wellness"],
    status: "published",
    contentFile: "morning-rituals.md",
  },
  {
    id: "architecture-of-silence",
    slug: "architecture-of-silence",
    title: "The Architecture of Silence",
    excerpt: "Exploring spaces designed specifically to cultivate quiet and reflection in modern cities.",
    coverImage: "https://picsum.photos/seed/silence/1600/900",
    date: "August 30, 2023",
    readTime: "10 min read",
    author: defaultAuthor,
    tags: ["Design", "Architecture", "Essays"],
    status: "published",
    contentFile: "architecture-of-silence.md",
  },
  {
    id: "taste-of-memory",
    slug: "taste-of-memory",
    title: "The Taste of Memory",
    excerpt: "How a simple bowl of broth transported me back to a rainy afternoon in Kyoto.",
    coverImage: "https://picsum.photos/seed/memory/1600/900",
    date: "August 12, 2023",
    readTime: "4 min read",
    author: defaultAuthor,
    tags: ["Food", "Memoir"],
    status: "published",
    contentFile: "taste-of-memory.md",
  }
];

/** Published articles only — for public-facing pages */
export const publishedArticles: Article[] = articles.filter(a => a.status !== "draft");
