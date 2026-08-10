import { useState, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ImageIcon, Video, Music, Loader2, Eye, Edit } from "lucide-react";
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
  status: "published" | "draft";
}

interface ArticleEditorProps {
  initial?: Partial<ArticleData>;
  onSave: (data: ArticleData) => void;
  onCancel: () => void;
  isNew?: boolean;
  allTags?: string[];
}

const emptyArticle: ArticleData = {
  title: "",
  excerpt: "",
  coverImage: "",
  date: new Date().toISOString().slice(0, 10),
  readTime: "5 min read",
  tags: "",
  content: "",
  status: "draft",
};

export function ArticleEditor({ initial, onSave, onCancel, isNew, allTags = [] }: ArticleEditorProps) {
  // Use the initial prop directly as the starting state; don't react to prop changes
  const initialRef = useRef(initial);
  const [data, setData] = useState<ArticleData>(() => {
    if (initialRef.current) {
      return { ...emptyArticle, ...initialRef.current };
    }
    return { ...emptyArticle };
  });

  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [coverUploading, setCoverUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    const lower = tagInput.toLowerCase();
    return allTags.filter(
      (t) => t.toLowerCase().includes(lower) && !data.tags.split(",").map((x) => x.trim().toLowerCase()).includes(t.toLowerCase())
    );
  }, [tagInput, allTags, data.tags]);

  function update<K extends keyof ArticleData>(key: K, value: ArticleData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.title.trim()) return;
    onSave(data);
  }

  function addTag(tag: string) {
    const current = data.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!current.includes(tag)) {
      update("tags", [...current, tag].join(", "));
    }
    setTagInput("");
    setShowTagSuggestions(false);
  }

  function removeTag(tag: string) {
    const current = data.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && t !== tag);
    update("tags", current.join(", "));
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
      // Include auth token for upload
      const token = sessionStorage.getItem("admin_token");
      xhr.open("POST", "/api/upload");
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    };
    input.click();
  }

  function handleCoverUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setCoverUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const token = sessionStorage.getItem("admin_token");
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (res.ok) {
          const { url } = await res.json();
          update("coverImage", url);
        } else {
          alert("Cover upload failed. Please try again.");
        }
      } catch {
        alert("Cover upload failed. Network error.");
      } finally {
        setCoverUploading(false);
      }
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

  const tagList = data.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

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
            className="px-4 py-2 inline-flex items-center gap-2 text-sm font-medium text-ink-light hover:text-ink transition-colors border border-ink/10 rounded-sm"
          >
            {showPreview ? (
              <>
                <Edit className="h-4 w-4" /> Edit
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" /> Preview
              </>
            )}
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

              <Field label="Status">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="published"
                      checked={data.status === "published"}
                      onChange={() => update("status", "published")}
                      className="text-accent"
                    />
                    <span className="text-sm text-ink">Published</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={data.status === "draft"}
                      onChange={() => update("status", "draft")}
                      className="text-amber-500"
                    />
                    <span className="text-sm text-ink">Draft</span>
                  </label>
                </div>
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

              <Field label="Cover Image">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={data.coverImage}
                    onChange={(e) => update("coverImage", e.target.value)}
                    className="flex-1 border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
                    placeholder="https://... or upload a local image"
                  />
                  <button
                    type="button"
                    disabled={coverUploading}
                    onClick={handleCoverUpload}
                    title="Upload local image as cover"
                    className="inline-flex items-center gap-1.5 rounded-sm border border-ink/10 px-3 py-2 text-sm font-medium text-ink-light hover:text-ink disabled:opacity-40 transition-colors shrink-0"
                  >
                    {coverUploading ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4" />
                        Upload
                      </>
                    )}
                  </button>
                </div>
                {data.coverImage && (
                  <div className="mt-2 aspect-[16/9] w-full overflow-hidden rounded-sm border border-ink/10 bg-ink/5">
                    <img
                      src={data.coverImage}
                      alt="Cover preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).nextElementSibling!.textContent = "Image failed to load";
                      }}
                      className="h-full w-full object-cover"
                    />
                    <span className="hidden" />
                  </div>
                )}
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
                {/* Tag chips */}
                {tagList.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tagList.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-ink-light hover:text-red-500 transition-colors"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setShowTagSuggestions(true);
                    }}
                    onFocus={() => setShowTagSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        if (tagInput.trim()) addTag(tagInput.trim());
                      }
                      if (e.key === "Backspace" && !tagInput && tagList.length > 0) {
                        removeTag(tagList[tagList.length - 1]);
                      }
                    }}
                    className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
                    placeholder="Type and press Enter to add..."
                  />
                  {showTagSuggestions && tagSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-sm border border-ink/10 bg-white shadow-lg max-h-36 overflow-y-auto">
                      {tagSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addTag(s)}
                          className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-ink/5 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
