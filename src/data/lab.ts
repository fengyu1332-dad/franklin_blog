export interface Project {
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
  {
    id: "sound-of-silence",
    slug: "sound-of-silence",
    title: "寂静之声",
    description: "一个专注于环境音采集与空间音频的实验项目，收录城市角落中被人遗忘的声音景观。",
    image: "https://picsum.photos/seed/lab-sound/800/600",
    date: "July 15, 2026",
    tags: ["Audio", "Web Audio API", "Field Recording"],
    url: "https://example.com",
    source: "https://github.com",
    status: "published" as const,
  },
  {
    id: "paper-plane",
    slug: "paper-plane",
    title: "纸飞机",
    description: "极简的 Markdown 笔记工具，支持本地存储和导出。设计理念是「打开即写，写完即走」。",
    image: "https://picsum.photos/seed/lab-paper/800/600",
    date: "June 28, 2026",
    tags: ["React", "TypeScript", "PWA"],
    url: "",
    source: "https://github.com",
    status: "published" as const,
  },
  {
    id: "memory-map",
    slug: "memory-map",
    title: "记忆地图",
    description: "将旅行照片按地理位置聚合，在地图上重走每一条路径，用视觉叙事重构旅途记忆。",
    image: "https://picsum.photos/seed/lab-map/800/600",
    date: "June 10, 2026",
    tags: ["Mapbox", "Photography", "Storytelling"],
    url: "https://example.com",
    source: "",
    status: "published" as const,
  },
  {
    id: "daily-photo-api",
    slug: "daily-photo-api",
    title: "每日一图 API",
    description: "从 Unsplash 精选图片中每日推送一张高质量摄影作品，支持 RSS 和邮件订阅。",
    image: "https://picsum.photos/seed/lab-daily/800/600",
    date: "May 22, 2026",
    tags: ["Node.js", "API", "Unsplash"],
    url: "https://example.com",
    source: "https://github.com",
    status: "published" as const,
  },
  {
    id: "type-lab",
    slug: "type-lab",
    title: "字形实验室",
    description: "在线字体对比工具，支持数百款开源中英文字体的实时预览、配对测试和 CSS 导出。",
    image: "https://picsum.photos/seed/lab-type/800/600",
    date: "May 8, 2026",
    tags: ["Typography", "CSS", "Design Tools"],
    url: "",
    source: "https://github.com",
    status: "published" as const,
  },
  {
    id: "silent-clock",
    slug: "silent-clock",
    title: "静默时钟",
    description: "一个没有指针的时钟——用渐变的色彩替代时间流逝，适合放在第二屏幕上作为专注背景。",
    image: "https://picsum.photos/seed/lab-clock/800/600",
    date: "April 15, 2026",
    tags: ["Canvas", "Generative", "Ambient"],
    url: "https://example.com",
    source: "https://github.com",
    status: "published" as const,
  },
];

export const publishedProjects: Project[] = projects.filter(p => p.status !== "draft");
