import { useState, useRef } from "react";
import { ImageIcon } from "lucide-react";
import { parse } from "exifr";

export interface PhotoData {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  status: "published" | "draft";
}

interface PhotoEditorProps {
  initial?: Partial<PhotoData>;
  onSave: (data: PhotoData) => void;
  onCancel: () => void;
  isNew?: boolean;
}

const emptyPhoto: PhotoData = {
  src: "",
  alt: "",
  caption: "",
  width: 800,
  height: 800,
  status: "draft",
};

export function PhotoEditor({ initial, onSave, onCancel, isNew }: PhotoEditorProps) {
  const initialRef = useRef(initial);
  const [data, setData] = useState<PhotoData>(() => {
    if (initialRef.current) return { ...emptyPhoto, ...initialRef.current };
    return { ...emptyPhoto };
  });
  const [uploading, setUploading] = useState(false);

  function update<K extends keyof PhotoData>(key: K, value: PhotoData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.src.trim()) return;
    onSave(data);
  }

  function handleUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);

      try {
        // Read file once as ArrayBuffer, reuse for both EXIF parsing and upload
        const buffer = await file.arrayBuffer();

        // Parse EXIF/XMP/IPTC metadata for Windows Title & Subject
        let exifTitle = "";
        let exifSubject = "";
        try {
          const exifData = await parse(buffer, {
            xmp: true,
            iptc: true,
            exif: true,
          });
          console.log("[PhotoEditor] Raw EXIF:", exifData);
          if (exifData) {
            // Title → Caption: Windows XPTitle / EXIF ImageDescription / XMP dc:title / IPTC ObjectName
            exifTitle = exifData.XPTitle
              || exifData.ImageDescription
              || exifData["dc:title"]
              || exifData.title
              || exifData.ObjectName
              || exifData.objectName
              || "";
            // Subject → Alt Text: Windows XPSubject / XMP dc:subject
            exifSubject = exifData.XPSubject
              || exifData["dc:subject"]
              || exifData.subject
              || "";
            console.log("[PhotoEditor] Title → Caption:", exifTitle || "(none)");
            console.log("[PhotoEditor] Subject → Alt Text:", exifSubject || "(none)");
          }
        } catch (exifErr) {
          console.warn("[PhotoEditor] EXIF read failed:", exifErr);
        }

        // Upload
        const blob = new Blob([buffer], { type: file.type });
        const formData = new FormData();
        formData.append("file", blob, file.name);
        const token = sessionStorage.getItem("admin_token");
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (res.ok) {
          const { url } = await res.json();
          update("src", url);
          if (exifTitle) update("caption", exifTitle);
          if (exifSubject) update("alt", exifSubject);
          // Load image to get natural dimensions
          const img = new Image();
          img.onload = () => {
            update("width", img.naturalWidth);
            update("height", img.naturalHeight);
          };
          img.src = url;
        }
      } catch (err) {
        console.error("[PhotoEditor] Upload failed:", err);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <h2 className="font-serif text-xl font-medium text-ink">
          {isNew ? "New Photo" : "Edit Photo"}
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

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-xl space-y-5">
          {/* Image preview + upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-light">
                Image<span className="text-accent ml-0.5">*</span>
              </span>
              <button
                type="button"
                disabled={uploading}
                onClick={handleUpload}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-ink disabled:opacity-40 transition-colors"
              >
                {uploading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    Upload Image
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={data.src}
              onChange={(e) => update("src", e.target.value)}
              className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
              placeholder="https://... or upload /uploads/..."
            />
            {data.src && (
              <div className="overflow-hidden rounded-sm border border-ink/10 bg-ink/5">
                <img src={data.src} alt={data.alt} className="w-full max-h-[300px] object-contain" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Width">
              <input
                type="number"
                value={data.width}
                onChange={(e) => update("width", Number(e.target.value))}
                className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
              />
            </Field>
            <Field label="Height">
              <input
                type="number"
                value={data.height}
                onChange={(e) => update("height", Number(e.target.value))}
                className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
              />
            </Field>
          </div>

          <Field label="Alt Text">
            <input
              type="text"
              value={data.alt}
              onChange={(e) => update("alt", e.target.value)}
              className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
              placeholder="Describe the image"
            />
          </Field>

          <Field label="Caption">
            <input
              type="text"
              value={data.caption}
              onChange={(e) => update("caption", e.target.value)}
              className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
              placeholder="Tokyo, 2023"
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
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-light block mb-2">{label}</span>
      {children}
    </label>
  );
}
