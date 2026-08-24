import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Plus, Edit2, Trash2, ArrowLeft, FileText, LogOut, FlaskConical, Camera, Eye } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Login } from "./Login";
import { ArticleEditor, type ArticleData } from "../components/admin/ArticleEditor";
import { LabEditor, type ProjectData } from "../components/admin/LabEditor";
import { PhotoEditor, type PhotoData } from "../components/admin/PhotoEditor";
import { ConfirmDialog } from "../components/admin/ConfirmDialog";

type ContentType = "articles" | "lab" | "photos";

interface ArticleMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  status: "published" | "draft";
}

interface ProjectMeta {
  slug: string;
  title: string;
  tags: string[];
  url: string;
  status: "published" | "draft";
}

interface PhotoMeta {
  slug: string;
  caption: string;
  src: string;
  size?: number | null;
  status: "published" | "draft";
}

const API_PREFIXES: Record<ContentType, string> = {
  articles: "/api/articles",
  lab: "/api/lab",
  photos: "/api/photos",
};

const TAB_LABELS: Record<ContentType, { label: string; icon: typeof FileText }> = {
  articles: { label: "Articles", icon: FileText },
  lab: { label: "Lab", icon: FlaskConical },
  photos: { label: "Photos", icon: Camera },
};

export function Admin() {
  const { isAuthenticated, authHeaders, logout } = useAuth();
  const { toast } = useToast();

  const [contentType, setContentType] = useState<ContentType>("articles");
  const [articles, setArticles] = useState<ArticleMeta[]>([]);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [photos, setPhotos] = useState<PhotoMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // slug or "new"
  const [editData, setEditData] = useState<ArticleData | ProjectData | PhotoData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  const apiPrefix = API_PREFIXES[contentType];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiPrefix, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (contentType === "articles") setArticles(data);
      else if (contentType === "lab") setProjects(data);
      else setPhotos(data);
    } catch (e) {
      console.error("Fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, [apiPrefix, authHeaders, contentType]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) setAllTags(await res.json());
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchTags();
  }, [fetchItems, fetchTags]);

  async function handleSave(data: ArticleData | ProjectData | PhotoData) {
    const headers = { "Content-Type": "application/json" as const, ...authHeaders() };

    if (contentType === "photos") {
      const d = data as PhotoData;
      const isNew = editing === "new";
      const res = await fetch(isNew ? apiPrefix : `${apiPrefix}/${editing}`, {
        method: isNew ? "POST" : "PUT",
        headers,
        body: JSON.stringify(d),
      });
      if (res.ok) {
        setEditing(null);
        await fetchItems();
        toast(isNew ? "Photo added." : "Photo updated.", "success");
      } else {
        toast("Save failed.", "error");
      }
      return;
    }

    if (contentType === "lab") {
      const d = data as ProjectData;
      const tags = d.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const body = { ...d, tags };
      const isNew = editing === "new";
      const res = await fetch(isNew ? apiPrefix : `${apiPrefix}/${editing}`, {
        method: isNew ? "POST" : "PUT",
        headers,
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEditing(null);
        await fetchItems();
        await fetchTags();
        toast(isNew ? "Project created." : "Project updated.", "success");
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error ?? "Save failed.", "error");
      }
      return;
    }

    // Articles
    const d = data as ArticleData;
    const tags = d.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const body = { ...d, tags };
    const isNew = editing === "new";
    const res = await fetch(isNew ? apiPrefix : `${apiPrefix}/${editing}`, {
      method: isNew ? "POST" : "PUT",
      headers,
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setEditing(null);
      await fetchItems();
      await fetchTags();
      toast(isNew ? "Article created." : "Article updated.", "success");
    } else {
      const err = await res.json().catch(() => ({}));
      toast(err.error ?? "Save failed.", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`${apiPrefix}/${deleteTarget}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) {
      setDeleteTarget(null);
      await fetchItems();
      toast("Deleted.", "info");
    } else {
      toast("Delete failed.", "error");
    }
  }

  async function startEdit(slug: string) {
    setEditing(slug);
    const res = await fetch(`${apiPrefix}/${slug}`, { headers: authHeaders() });
    if (!res.ok) return;
    const item = await res.json();

    if (contentType === "articles") {
      setEditData({
        title: item.title ?? "",
        excerpt: item.excerpt ?? "",
        coverImage: item.coverImage ?? "",
        date: item.date ?? "",
        readTime: item.readTime ?? "",
        tags: (item.tags ?? []).join(", "),
        content: item.content ?? "",
        status: item.status ?? "draft",
      });
    } else if (contentType === "lab") {
      setEditData({
        title: item.title ?? "",
        description: item.description ?? "",
        image: item.image ?? "",
        date: item.date ?? "",
        tags: (item.tags ?? []).join(", "),
        url: item.url ?? "",
        source: item.source ?? "",
        status: item.status ?? "draft",
      });
    } else {
      setEditData({
        src: item.src ?? "",
        alt: item.alt ?? "",
        caption: item.caption ?? "",
        width: item.width ?? 800,
        height: item.height ?? 800,
        status: item.status ?? "draft",
      });
    }
  }

  function startNew() {
    setEditing("new");
    setEditData(null);
  }

  function switchType(type: ContentType) {
    setContentType(type);
    setEditing(null);
  }

  // ─── Unauthenticated ───
  if (!isAuthenticated) {
    return <Login onSuccess={() => {}} />;
  }

  // ─── Editor View ───
  if (editing) {
    return (
      <div className="flex min-h-screen flex-col bg-paper">
        <div className="border-b border-ink/10 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setEditing(null)}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-light hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {TAB_LABELS[contentType].label}
          </button>
          <button onClick={logout} className="inline-flex items-center gap-2 text-sm font-medium text-ink-light hover:text-ink transition-colors">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
        <div className="flex-1">
          {contentType === "articles" && (
            <ArticleEditor
              initial={editData as ArticleData | undefined}
              isNew={editing === "new"}
              allTags={allTags}
              onSave={handleSave as (data: ArticleData) => void}
              onCancel={() => setEditing(null)}
            />
          )}
          {contentType === "lab" && (
            <LabEditor
              initial={editData as ProjectData | undefined}
              isNew={editing === "new"}
              allTags={allTags}
              onSave={handleSave as (data: ProjectData) => void}
              onCancel={() => setEditing(null)}
            />
          )}
          {contentType === "photos" && (
            <PhotoEditor
              initial={editData as PhotoData | undefined}
              isNew={editing === "new"}
              onSave={handleSave as (data: PhotoData) => void}
              onCancel={() => setEditing(null)}
            />
          )}
        </div>
      </div>
    );
  }

  // ─── List View ───
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <h1 className="font-serif text-xl font-semibold tracking-wide text-ink">Admin</h1>
            {/* Content type tabs */}
            <nav className="flex items-center gap-1">
              {(Object.entries(TAB_LABELS) as [ContentType, { label: string; icon: typeof FileText }][]).map(([key, { label, icon: Icon }]) => (
                <button
                  key={key}
                  onClick={() => switchType(key)}
                  className={`inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                    contentType === key
                      ? "bg-ink text-white"
                      : "text-ink-light hover:text-ink hover:bg-ink/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={startNew}
              className="inline-flex items-center gap-2 rounded-sm bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New {TAB_LABELS[contentType].label.replace(/s$/, "")}
            </button>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-sm border border-ink/10 px-3 py-2 text-sm font-medium text-ink-light hover:text-ink transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          key={contentType}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
            </div>
          ) : (
            <ContentTable
              contentType={contentType}
              articles={articles}
              projects={projects}
              photos={photos}
              onEdit={startEdit}
              onDelete={setDeleteTarget}
              onNew={startNew}
            />
          )}
        </motion.div>
      </main>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete ${TAB_LABELS[contentType].label.replace(/s$/, "")}`}
        message="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Content Table ───

interface ContentTableProps {
  contentType: ContentType;
  articles: ArticleMeta[];
  projects: ProjectMeta[];
  photos: PhotoMeta[];
  onEdit: (slug: string) => void;
  onDelete: (slug: string) => void;
  onNew: () => void;
}

function ContentTable({ contentType, articles, projects, photos, onEdit, onDelete, onNew }: ContentTableProps) {
  if (contentType === "articles") {
    if (articles.length === 0) return <EmptyState onNew={onNew} label="articles" />;
    return (
      <div className="overflow-hidden rounded-sm border border-ink/10">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/5">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light">Title</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light hidden sm:table-cell">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light hidden sm:table-cell">Date</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light hidden md:table-cell">Tags</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {articles.map((a) => (
              <tr key={a.slug} className="hover:bg-ink/[0.02] transition-colors">
                <td className="px-6 py-4"><span className="font-serif text-sm text-ink line-clamp-2">{a.title}</span></td>
                <td className="px-6 py-4 hidden sm:table-cell whitespace-nowrap">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-6 py-4 text-sm text-ink-light hidden sm:table-cell whitespace-nowrap">{a.date}</td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <TagList tags={a.tags} />
                </td>
                <td className="px-6 py-4"><ActionButtons slug={a.slug} onEdit={onEdit} onDelete={onDelete} previewSlug={a.status === "draft" ? a.slug : undefined} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (contentType === "lab") {
    if (projects.length === 0) return <EmptyState onNew={onNew} label="projects" />;
    return (
      <div className="overflow-hidden rounded-sm border border-ink/10">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/5">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light">Title</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light hidden sm:table-cell">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light hidden md:table-cell">URL</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light hidden md:table-cell">Tags</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {projects.map((p) => (
              <tr key={p.slug} className="hover:bg-ink/[0.02] transition-colors">
                <td className="px-6 py-4"><span className="font-serif text-sm text-ink line-clamp-2">{p.title}</span></td>
                <td className="px-6 py-4 hidden sm:table-cell whitespace-nowrap">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="text-sm text-ink-light line-clamp-1 max-w-[200px]">{p.url || "—"}</span>
                </td>
                <td className="px-6 py-4 hidden md:table-cell"><TagList tags={p.tags} /></td>
                <td className="px-6 py-4"><ActionButtons slug={p.slug} onEdit={onEdit} onDelete={onDelete} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Photos
  if (photos.length === 0) return <EmptyState onNew={onNew} label="photos" />;
  return (
    <div className="overflow-hidden rounded-sm border border-ink/10">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-ink/10 bg-ink/5">
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light">Preview</th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light">Caption</th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light hidden sm:table-cell">Status</th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light hidden sm:table-cell">Size</th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light w-24">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {photos.map((p) => (
            <tr key={p.slug} className="hover:bg-ink/[0.02] transition-colors">
              <td className="px-6 py-4">
                <div className="h-12 w-12 overflow-hidden rounded-sm border border-ink/10 bg-ink/5">
                  <img src={p.src} alt={p.caption} className="h-full w-full object-cover" />
                </div>
              </td>
              <td className="px-6 py-4"><span className="text-sm text-ink line-clamp-2">{p.caption || "Untitled"}</span></td>
              <td className="px-6 py-4 hidden sm:table-cell whitespace-nowrap"><StatusBadge status={p.status} /></td>
              <td className="px-6 py-4 text-sm text-ink-light hidden sm:table-cell whitespace-nowrap">
                {typeof p.size === "number" ? formatBytes(p.size) : "—"}
              </td>
              <td className="px-6 py-4"><ActionButtons slug={p.slug} onEdit={onEdit} onDelete={onDelete} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
      status === "draft" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
    }`}>
      {status === "draft" ? "Draft" : "Published"}
    </span>
  );
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <span key={t} className="inline-block rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink-light">{t}</span>
      ))}
    </div>
  );
}

function ActionButtons({ slug, onEdit, onDelete, previewSlug }: { slug: string; onEdit: (s: string) => void; onDelete: (s: string) => void; previewSlug?: string }) {
  return (
    <div className="flex items-center gap-2">
      {previewSlug && (
        <a
          href={`/post/${encodeURIComponent(previewSlug)}`}
          target="_blank"
          rel="noreferrer"
          className="p-2 text-ink-light hover:text-accent transition-colors"
          title="Preview draft"
        >
          <Eye className="h-4 w-4" />
        </a>
      )}
      <button onClick={() => onEdit(slug)} className="p-2 text-ink-light hover:text-ink transition-colors" title="Edit">
        <Edit2 className="h-4 w-4" />
      </button>
      <button onClick={() => onDelete(slug)} className="p-2 text-ink-light hover:text-red-500 transition-colors" title="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function EmptyState({ onNew, label }: { onNew: () => void; label: string }) {
  return (
    <div className="py-24 text-center">
      <p className="text-ink-light text-lg">No {label} yet.</p>
      <button
        onClick={onNew}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-ink transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create your first {label.replace(/s$/, "")}
      </button>
    </div>
  );
}
