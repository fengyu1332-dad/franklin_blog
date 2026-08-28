import { useState, useEffect } from "react";
import { User, Upload } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../Toast";

interface SiteAuthor {
  name: string;
  avatar: string;
  bio: string;
  twitter?: string;
  instagram?: string;
}

export function SiteSettings() {
  const { authHeaders } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<SiteAuthor>({
    name: "",
    avatar: "",
    bio: "",
    twitter: "",
    instagram: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/site-config");
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error("[SiteSettings] load failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update<K extends keyof SiteAuthor>(key: K, value: SiteAuthor[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
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
        const buffer = await file.arrayBuffer();
        const blob = new Blob([buffer], { type: file.type });
        const formData = new FormData();
        formData.append("file", blob, file.name);
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        });
        if (res.ok) {
          const { url } = await res.json();
          update("avatar", url);
        } else {
          const err = await res.json().catch(() => ({}));
          toast(err.error ?? `Upload failed (HTTP ${res.status})`, "error");
        }
      } catch (err) {
        console.error("[SiteSettings] upload failed:", err);
        toast("Upload failed — cannot reach the local server.", "error");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  async function handleSave() {
    if (!data.avatar.trim()) {
      toast("Avatar URL is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast("Site author saved. Run publish to deploy to the live site.", "success");
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error ?? `Save failed (HTTP ${res.status})`, "error");
      }
    } catch (err) {
      console.error("[SiteSettings] save failed:", err);
      toast("Save failed — cannot reach the local server. Is it running?", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-medium text-ink">Site Author</h2>
        <p className="mt-1 text-sm text-ink-light">
          Used by the About page, Lab cards, and Essays author bylines. Changes are saved locally
          and go live after you run <code className="rounded bg-ink/5 px-1 py-0.5 text-xs">npm run publish</code>.
        </p>
      </div>

      <div className="space-y-5">
        {/* Avatar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-light">
              Author Avatar<span className="text-accent ml-0.5">*</span>
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
                  <Upload className="h-4 w-4" />
                  Upload Image
                </>
              )}
            </button>
          </div>
          <input
            type="text"
            value={data.avatar}
            onChange={(e) => update("avatar", e.target.value)}
            className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
            placeholder="/media/... or https://..."
          />
          {data.avatar && (
            <div className="overflow-hidden rounded-xl border border-ink/10 bg-ink/5 w-28">
              <img src={data.avatar} alt="Author avatar" className="h-28 w-28 object-cover" />
            </div>
          )}
        </div>

        <Field label="Name">
          <input
            type="text"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
            placeholder="Franklin HUANG"
          />
        </Field>

        <Field label="Bio">
          <textarea
            value={data.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors resize-y"
            placeholder="Short bio shown on the About page"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Twitter">
            <input
              type="text"
              value={data.twitter ?? ""}
              onChange={(e) => update("twitter", e.target.value)}
              className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
              placeholder="@franklinhuang"
            />
          </Field>
          <Field label="Instagram">
            <input
              type="text"
              value={data.instagram ?? ""}
              onChange={(e) => update("instagram", e.target.value)}
              className="w-full border border-ink/10 rounded-sm px-3 py-2.5 text-sm bg-transparent focus:border-accent focus:outline-none transition-colors"
              placeholder="@franklin.captures"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-ink hover:bg-ink/80 rounded-sm transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
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
