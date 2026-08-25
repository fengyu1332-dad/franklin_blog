export interface Photo {
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
  {
    id: "vastness",
    slug: "vastness",
    src: "/media/e024adf3-ea21-407b-bd73-f1cc5e1d2e7a.png",
    alt: "Paradise in heaven, Su‑Hang on earth",
    caption: "Xihu，HangZhou，China，2023",
    width: 1195,
    height: 896,
    status: "published",
  },
  {
    id: "tokyo-2023",
    slug: "tokyo-2023",
    src: "/media/cc2234a7-6e7a-4b7e-9d8a-863124e556cf.jpeg",
    alt: "Chinese‑style beauty",
    caption: "Zhejiang，China，2023",
    width: 2048,
    height: 953,
    status: "published",
  },
  {
    id: "swiss-alps",
    slug: "swiss-alps",
    src: "/media/ff66a2d8-cc45-4e4f-8950-78500bb64217.png",
    alt: "Buddhism and Chinese‑style aesthetics",
    caption: "Zhejiang，China, 2023",
    width: 842,
    height: 1264,
    status: "published",
  },
  {
    id: "strangers",
    slug: "strangers",
    src: "/media/138e2a0a-d96e-49be-b16c-614be941853a.png",
    alt: "Once you’ve been to Huangshan, all other mountains pale in comparison.",
    caption: "Huangshan，Anhui，China，2025",
    width: 1195,
    height: 896,
    status: "published",
  },
  {
    id: "shadows-and-light",
    slug: "shadows-and-light",
    src: "/media/03a3761d-422b-40ee-8263-120bdd59c201.jpg",
    alt: "A heart‑warming sunset glow",
    caption: "Canada，2022",
    width: 2048,
    height: 1365,
    status: "published",
  },
  {
    id: "pacific-coast",
    slug: "pacific-coast",
    src: "/media/250bb48a-2d6b-4c73-b708-e9eeb915430e.png",
    alt: "Beneath the dusk, we behold the serenity of sea and sky.",
    caption: "Canada，2022",
    width: 1376,
    height: 768,
    status: "published",
  },
  {
    id: "morning-rituals",
    slug: "morning-rituals",
    src: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&h=800&fit=crop",
    alt: "Coffee shop",
    caption: "Morning rituals",
    width: 800,
    height: 800,
    status: "published",
  },
  {
    id: "midnight",
    slug: "midnight",
    src: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=800&h=1200&fit=crop",
    alt: "City lights",
    caption: "Midnight",
    width: 800,
    height: 1200,
    status: "published",
  },
  {
    id: "into-the-woods",
    slug: "into-the-woods",
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&h=1200&fit=crop",
    alt: "Forest path",
    caption: "Into the woods",
    width: 1000,
    height: 1200,
    status: "published",
  },
  {
    id: "golden-hour",
    slug: "golden-hour",
    src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1200&h=800&fit=crop",
    alt: "Desert dunes",
    caption: "Golden hour",
    width: 1200,
    height: 800,
    status: "published",
  },
  {
    id: "details",
    slug: "details",
    src: "https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?q=80&w=800&h=800&fit=crop",
    alt: "Still life",
    caption: "Details",
    width: 800,
    height: 800,
    status: "published",
  },
  {
    id: "concrete-geometry",
    slug: "concrete-geometry",
    src: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=800&h=800&fit=crop",
    alt: "Architecture",
    caption: "Concrete geometry",
    width: 800,
    height: 800,
    status: "published",
  },
  {
    id: "2021-the-maijishan-grottoes",
    slug: "2021-the-maijishan-grottoes",
    src: "/media/87bad1d2-928b-450e-9b48-c5ea37fc9c19.jpg",
    alt: "Got to check out the Maijishan Grottoes today, can't believe people built these amazing caves and walkways on a steep cliff so long ago. Hiked all the way up, the view and the ancient carvings are so worth every step of the climb.",
    caption: "2021 the Maijishan Grottoes",
    width: 4752,
    height: 3168,
    status: "published",
  }
];

export const publishedPhotos: Photo[] = photos.filter(p => p.status !== "draft");
