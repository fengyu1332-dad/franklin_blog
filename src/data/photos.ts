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
    src: "/media/22e806dc-2246-4194-b483-46a4b51234bc.jpg",
    alt: "Painterly Oil‑painting‑style Colours",
    caption: "Canada，2022",
    width: 1365,
    height: 2048,
    status: "published",
  },
  {
    id: "midnight",
    slug: "midnight",
    src: "/media/436fafad-7385-4c27-86c9-d6e6df70cab4.png",
    alt: "So close to heaven",
    caption: "Canada，2022",
    width: 1264,
    height: 842,
    status: "published",
  },
  {
    id: "into-the-woods",
    slug: "into-the-woods",
    src: "/media/7fff2f83-2642-49b8-8363-7170b645db2a.png",
    alt: "Bathed in the Buddha’s radiance",
    caption: "Henan，China，2020",
    width: 842,
    height: 1264,
    status: "published",
  },
  {
    id: "golden-hour",
    slug: "golden-hour",
    src: "/media/97595148-6978-4cd3-bd82-91b82fb2bebf.png",
    alt: "Buddha and I",
    caption: "Henan，China，2020",
    width: 842,
    height: 1264,
    status: "published",
  },
  {
    id: "details",
    slug: "details",
    src: "/media/7d521287-cfcb-4e34-be71-240c77fe7a4a.png",
    alt: "Maijishan Grottoes Scenic Area",
    caption: "Henan，China，2020",
    width: 842,
    height: 1264,
    status: "published",
  },
  {
    id: "concrete-geometry",
    slug: "concrete-geometry",
    src: "/media/32870b90-5699-43e3-9b71-e9aa9b3540ef.png",
    alt: "The place closest to the sky",
    caption: "Tibet，China，2021",
    width: 1264,
    height: 842,
    status: "published",
  },
  {
    id: "2021-the-maijishan-grottoes",
    slug: "2021-the-maijishan-grottoes",
    src: "/media/522d9c07-3bb6-4954-a5fc-df8dcfd7fbe8.jpg",
    alt: "lowers at the sky’s temple",
    caption: "Tibet，China，2021",
    width: 1264,
    height: 842,
    status: "published",
  }
];

export const publishedPhotos: Photo[] = photos.filter(p => p.status !== "draft");
