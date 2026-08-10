import { useState, useRef, useMemo } from "react";
import { ImageIcon, Link2, Github } from "lucide-react";

export interface ProjectData {
  title: string;
  description: string;
  image: string;
  date: string;
  tags: string;
  url: string;
  source: string;
  status: "published" | "draft";
}

interface LabEditorProps {
  initial?: Partial<ProjectData>;
  onSave: (data: ProjectData) => void;
  onCancel: () => void;
  isNew?: boolean;
  allTags?: string[];
}

const emptyProject: ProjectData = {
  title: "",
  description: "",
  image: "",
  date: new Date().toISOString().slice(0, 10),
  tags: "",
  url: "",
  source: "",
  status: "draft",
};

export function LabEditor({ initial, onSave, onCancel, isNew, allTags = [] }: LabEditorProps) {
  const initialRef = useRef(initial);
  const [data, setData] = useState<ProjectData>(() => {
    if (initialRef.current) return { ...emptyProject, ...initialRef.current };
    return { ...emptyProject };
  });
  const [coverUploading, setCoverUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    const lower = tagInput.toLowerCase();
    return allTags.filter(
      (t) => t.toLowerCase().includes(lower) && !data.tags.split(",").map((x) => x.trim().toLowerCase()).includes(t.toLowerCase())
    );
  }, [tagInput, allTags, data.tags]);

  function update<K extends keyof ProjectData>(key: K, value: ProjectData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.title.trim()) return;
    onSave(data);
  }

  function addTag(tag: string) {
    const current = data.tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (!current.includes(tag)) {
      update("tags", [...current, tag].join(", "));
    }
    setTagInput("");
    setShowTagSuggestions(false);
  }

  function removeTag(tag: string) {
    const current = data.tags.split(",").map((t) => t.trim()).filter((t) => t && t !== tag);
    update("tags", current.join(", "));
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
          update("image", url);
        }
      } catch { /* ignore */ } finally {
        setCoverUploading(false);
      }
    };
    input.click();
  }

  const tagList = data.tags.split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <h2 className="font-serif text-xl font-medium text-ink">
          {isNew ? "New Project" : "Edit Project"}
        </h2>
        <div className="flex items-center gap-2">
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
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-5">
          <Field label="Title" required>
            <input
              type="text"
              value={data.title}
              onChange={(e) => update("title", e.target.value)}
              className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
              placeholder="Project name"
            />
          </Field>

          <Field label="Status">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="published" checked={data.status === "published"} onChange={() => update("status", "published")} className="text-accent" />
                <span className="text-sm text-ink">Published</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="draft" checked={data.status === "draft"} onChange={() => update("status", "draft")} className="text-amber-500" />
                <span className="text-sm text-ink">Draft</span>
              </label>
            </div>
          </Field>

          <Field label="Description">
            <textarea
              value={data.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors resize-none"
              placeholder="What does this project do?"
            />
          </Field>

          <Field label="Date">
            <input
              type="text"
              value={data.date}
              onChange={(e) => update("date", e.target.value)}
              className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
              placeholder="July 15, 2026"
            />
          </Field>

          <Field label="Cover Image">
            <div className="flex gap-2">
              <input
                type="text"
                value={data.image}
                onChange={(e) => update("image", e.target.value)}
                className="flex-1 border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
                placeholder="https://... or upload"
              />
              <button
                type="button"
                disabled={coverUploading}
                onClick={handleCoverUpload}
                className="inline-flex items-center gap-1.5 rounded-sm border border-ink/10 px-3 py-2 text-sm font-medium text-ink-light hover:text-ink disabled:opacity-40 transition-colors shrink-0"
              >
                {coverUploading ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {data.image && (
              <div className="mt-2 aspect-[16/9] w-full max-w-sm overflow-hidden rounded-sm border border-ink/10 bg-ink/5">
                <img src={data.image} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Live URL">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light" />
                <input
                  type="text"
                  value={data.url}
                  onChange={(e) => update("url", e.target.value)}
                  className="w-full border border-ink/10 rounded-sm pl-9 pr-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
                  placeholder="https://your-project.com"
                />
              </div>
            </Field>
            <Field label="Source (GitHub)">
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light" />
                <input
                  type="text"
                  value={data.source}
                  onChange={(e) => update("source", e.target.value)}
                  className="w-full border border-ink/10 rounded-sm pl-9 pr-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
                  placeholder="https://github.com/..."
                />
              </div>
            </Field>
          </div>

          <Field label="Tags (comma-separated)">
            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {tagList.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-ink-light hover:text-red-500 transition-colors">&times;</button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); setShowTagSuggestions(true); }}
                onFocus={() => setShowTagSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); if (tagInput.trim()) addTag(tagInput.trim()); }
                  if (e.key === "Backspace" && !tagInput && tagList.length > 0) removeTag(tagList[tagList.length - 1]);
                }}
                className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
                placeholder="Type and press Enter to add..."
              />
              {showTagSuggestions && tagSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-sm border border-ink/10 bg-white shadow-lg max-h-36 overflow-y-auto">
                  {tagSuggestions.map((s) => (
                    <button key={s} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addTag(s)} className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-ink/5 transition-colors">{s}</button>
                  ))}
                </div>
              )}
            </div>
          </Field>
        </div>
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
