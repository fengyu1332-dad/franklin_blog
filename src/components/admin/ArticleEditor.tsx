import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ImageIcon, Video, Music, Loader2 } from "lucide-react";
import { ImageEmbed } from "../ImageEmbed";
import { VideoEmbed } from "../VideoEmbed";
import { AudioEmbed } from "../AudioEmbed";
import { QuoteEmbed } from "../QuoteEmbed";
import type { ComponentProps } from "react";

export interface ArticleData {
  title: string;
  excerpt: string;
  coverImage: string;
  date: string;
  readTime: string;
  tags: string;
  content: string;
}

interface ArticleEditorProps {
  initial?: Partial<ArticleData>;
  onSave: (data: ArticleData) => void;
  onCancel: () => void;
  isNew?: boolean;
}

const emptyArticle: ArticleData = {
  title: "",
  excerpt: "",
  coverImage: "",
  date: new Date().toISOString().slice(0, 10),
  readTime: "5 min read",
  tags: "",
  content: "",
};

export function ArticleEditor({ initial, onSave, onCancel, isNew }: ArticleEditorProps) {
  const [data, setData] = useState<ArticleData>({ ...emptyArticle, ...initial });
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null); // "image" | "video" | "audio" | null
  const [uploadProgress, setUploadProgress] = useState(0);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initial) setData((prev) => ({ ...prev, ...initial }));
  }, [initial]);

  function update<K extends keyof ArticleData>(key: K, value: ArticleData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.title.trim()) return;
    onSave(data);
  }

  function insertAtCursor(tag: string) {
    const textarea = contentRef.current;
    if (!textarea) {
      update("content", data.content + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = data.content.slice(0, start);
    const after = data.content.slice(end);
    update("content", before + tag + after);
    // Restore cursor after the inserted tag
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  }

  function handleUpload(type: "image" | "video" | "audio") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "image" ? "image/*" : type === "video" ? "video/*" : "audio/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setUploading(type);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => {
        setUploading(null);
        if (xhr.status === 200) {
          const { url } = JSON.parse(xhr.responseText);
          const title = prompt("Caption / title for this media:", file.name) || file.name;
          if (type === "image") {
            insertAtCursor(`![${title}](${url} "wide")\n`);
          } else if (type === "video") {
            insertAtCursor(`:video{src="${url}" title="${title}"}\n`);
          } else {
            insertAtCursor(`:audio{src="${url}" title="${title}"}\n`);
          }
        } else {
          alert("Upload failed. Please try again.");
        }
      });
      xhr.addEventListener("error", () => {
        setUploading(null);
        alert("Upload failed. Network error.");
      });
      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    };
    input.click();
  }

  // Pre-process media directives for preview
  const previewContent = data.content
    .replace(/:video\{src="([^"]+)"(?:\s+title="([^"]*)")?\s*\}/g, (_, src, title) =>
      `![${title || "Video"}](${src} "video")`
    )
    .replace(/:audio\{src="([^"]+)"(?:\s+title="([^"]*)")?\s*\}/g, (_, src, title) =>
      `![${title || "Audio"}](${src} "audio")`
    );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <h2 className="font-serif text-xl font-medium text-ink">
          {isNew ? "New Article" : "Edit Article"}
        </h2>
        <div className="flex items-center gap-2">
          {/* Upload buttons — only in edit mode */}
          {!showPreview && (
            <>
              <span className="text-xs text-ink-light mr-1">Upload:</span>
              <button
                type="button"
                disabled={uploading !== null}
                onClick={() => handleUpload("image")}
                title="Upload image"
                className="p-2 text-ink-light hover:text-ink disabled:opacity-40 transition-colors border border-ink/10 rounded-sm"
              >
                {uploading === "image" ? (
                  <span className="flex items-center gap-1 text-xs">{uploadProgress}%</span>
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                disabled={uploading !== null}
                onClick={() => handleUpload("video")}
                title="Upload video"
                className="p-2 text-ink-light hover:text-ink disabled:opacity-40 transition-colors border border-ink/10 rounded-sm"
              >
                {uploading === "video" ? (
                  <span className="flex items-center gap-1 text-xs">{uploadProgress}%</span>
                ) : (
                  <Video className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                disabled={uploading !== null}
                onClick={() => handleUpload("audio")}
                title="Upload audio"
                className="p-2 text-ink-light hover:text-ink disabled:opacity-40 transition-colors border border-ink/10 rounded-sm"
              >
                {uploading === "audio" ? (
                  <span className="flex items-center gap-1 text-xs">{uploadProgress}%</span>
                ) : (
                  <Music className="h-4 w-4" />
                )}
              </button>
              <span className="w-px h-6 bg-ink/10 mx-1" />
            </>
          )}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-sm font-medium text-ink-light hover:text-ink transition-colors border border-ink/10 rounded-sm"
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-ink-light hover:text-ink transition-colors border border-ink/10 rounded-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium text-white bg-ink hover:bg-ink/80 rounded-sm transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto">
        {showPreview ? (
          <div className="mx-auto max-w-3xl px-6 py-12">
            <article className="prose prose-lg prose-stone max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-ink-light prose-a:text-accent">
              <h1 className="!text-4xl !font-serif !font-medium mb-6">{data.title || "Untitled"}</h1>
              {data.excerpt && (
                <p className="lead text-2xl font-serif italic text-ink mb-12">{data.excerpt}</p>
              )}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={previewComponents}
              >
                {previewContent || "*No content yet.*"}
              </ReactMarkdown>
            </article>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
            {/* Metadata fields */}
            <div className="space-y-5">
              <Field label="Title" required>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => update("title", e.target.value)}
                  className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
                  placeholder="Article title"
                />
              </Field>

              <Field label="Excerpt">
                <textarea
                  value={data.excerpt}
                  onChange={(e) => update("excerpt", e.target.value)}
                  rows={2}
                  className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors resize-none"
                  placeholder="Brief summary for cards and SEO"
                />
              </Field>

              <Field label="Cover Image URL">
                <input
                  type="text"
                  value={data.coverImage}
                  onChange={(e) => update("coverImage", e.target.value)}
                  className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
                  placeholder="https://..."
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Date">
                  <input
                    type="text"
                    value={data.date}
                    onChange={(e) => update("date", e.target.value)}
                    className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
                    placeholder="July 21, 2026"
                  />
                </Field>
                <Field label="Read Time">
                  <input
                    type="text"
                    value={data.readTime}
                    onChange={(e) => update("readTime", e.target.value)}
                    className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
                    placeholder="5 min read"
                  />
                </Field>
              </div>

              <Field label="Tags (comma-separated)">
                <input
                  type="text"
                  value={data.tags}
                  onChange={(e) => update("tags", e.target.value)}
                  className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
                  placeholder="Travel, Photography"
                />
              </Field>
            </div>

            {/* Content */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-light mb-2">
                Content (Markdown)
              </label>
              <textarea
                ref={contentRef}
                value={data.content}
                onChange={(e) => update("content", e.target.value)}
                rows={24}
                className="flex-1 w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors resize-none font-mono"
                placeholder={`Write markdown here...

## Section Title

Paragraph text...

> Blockquote
> — Author

![alt text](image-url "wide")

:video{src="https://youtube.com/watch?v=xxx" title="Video Title"}

:audio{src="https://example.com/podcast.mp3" title="Episode Title"}
`}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-light block mb-2">
        {label}{required && <span className="text-accent ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

const previewComponents: ComponentProps<typeof ReactMarkdown>["components"] = {
  img({ src, alt, title }) {
    if (!src) return null;
    if (title === "video") return <VideoEmbed src={src} title={alt ?? undefined} />;
    if (title === "audio") return <AudioEmbed src={src} title={alt ?? undefined} />;
    return <ImageEmbed src={src} alt={alt ?? ""} caption={alt ?? undefined} size={(title as never) || "default"} />;
  },
  blockquote({ children }) {
    let fullText = "";
    function extract(n: unknown): string {
      if (typeof n === "string") return n;
      if (Array.isArray(n)) return n.map(extract).join("");
      if (n && typeof n === "object" && "props" in n) return extract((n as { props?: { children?: unknown } }).props?.children);
      return "";
    }
    fullText = extract(children);
    const lines = fullText.split("\n").filter(Boolean);
    const last = lines[lines.length - 1]?.trim() ?? "";
    let author = "";
    if (last.startsWith("— ")) { author = last.replace(/^—\s*/, ""); lines.pop(); }
    return <QuoteEmbed quote={lines.join("\n").trim()} author={author || undefined} />;
  },
};
