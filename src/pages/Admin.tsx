import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Plus, Edit2, Trash2, ArrowLeft, FileText } from "lucide-react";
import { ArticleEditor, type ArticleData } from "../components/admin/ArticleEditor";
import { ConfirmDialog } from "../components/admin/ConfirmDialog";

interface ArticleMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  contentFile: string;
}

const API = "/api/articles";

export function Admin() {
  const [articles, setArticles] = useState<ArticleMeta[]>([]);
  const [editing, setEditing] = useState<string | null>(null); // slug or "new"
  const [editData, setEditData] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch(API);
      if (res.ok) setArticles(await res.json());
    } catch (e) {
      console.error("Failed to fetch articles", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  async function handleSave(data: ArticleData) {
    const tags = data.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body = { ...data, tags };

    if (editing === "new") {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEditing(null);
        fetchArticles();
        window.location.reload(); // Refresh to pick up new articles.ts
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to create");
      }
    } else {
      const res = await fetch(`${API}/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEditing(null);
        fetchArticles();
      } else {
        alert("Failed to update");
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`${API}/${deleteTarget}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteTarget(null);
      fetchArticles();
    } else {
      alert("Failed to delete");
    }
  }

  async function startEdit(slug: string) {
    setEditing(slug);
    const res = await fetch(`${API}/${slug}`);
    if (res.ok) {
      const article = await res.json();
      setEditData({
        title: article.title ?? "",
        excerpt: article.excerpt ?? "",
        coverImage: article.coverImage ?? "",
        date: article.date ?? "",
        readTime: article.readTime ?? "",
        tags: (article.tags ?? []).join(", "),
        content: article.content ?? "",
      });
    }
  }

  function startNew() {
    setEditing("new");
    setEditData(null);
  }

  // ─── Editor View ───
  if (editing) {
    return (
      <div className="flex min-h-screen flex-col bg-paper">
        <div className="border-b border-ink/10 px-4 py-3">
          <button
            onClick={() => setEditing(null)}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-light hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to articles
          </button>
        </div>
        <div className="flex-1">
          <ArticleEditor
            initial={editData ?? undefined}
            isNew={editing === "new"}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </div>
      </div>
    );
  }

  // ─── List View ───
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Admin header */}
      <header className="border-b border-ink/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <FileText className="h-5 w-5 text-ink-light" />
            <h1 className="font-serif text-xl font-semibold tracking-wide text-ink">Admin</h1>
          </div>
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 rounded-sm bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Article
          </button>
        </div>
      </header>

      {/* Article list */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
            </div>
          ) : articles.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-ink-light text-lg">No articles yet.</p>
              <button
                onClick={startNew}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-ink transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create your first article
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-sm border border-ink/10">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-ink/10 bg-ink/5">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light">Title</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light hidden sm:table-cell">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light hidden md:table-cell">Tags</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-ink-light w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {articles.map((article) => (
                    <tr key={article.slug} className="hover:bg-ink/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-serif text-sm text-ink line-clamp-2">{article.title}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-light hidden sm:table-cell whitespace-nowrap">
                        {article.date}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {article.tags.map((t) => (
                            <span key={t} className="inline-block rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink-light">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(article.slug)}
                            className="p-2 text-ink-light hover:text-ink transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(article.slug)}
                            className="p-2 text-ink-light hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Article"
        message={`Are you sure you want to delete this article? This action cannot be undone. The markdown file will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
