import { useParams, Navigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useMemo, useState, useEffect, type ComponentProps } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { publishedArticles, defaultAuthor, type Article } from "../data/articles";
import { siteConfig } from "../data/site-config";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AuthorInfo } from "../components/AuthorInfo";
import { QuoteEmbed } from "../components/QuoteEmbed";
import { ImageEmbed } from "../components/ImageEmbed";
import { VideoEmbed } from "../components/VideoEmbed";
import { AudioEmbed } from "../components/AudioEmbed";
import { FadeImage } from "../components/FadeImage";
import { useAuth } from "../context/AuthContext";

const contentModules = import.meta.glob<string>(
  "../content/articles/*.md",
  { eager: true, query: "?raw", import: "default" }
);

function stripFrontmatter(raw: string): string {
  if (raw.startsWith("---")) {
    const second = raw.indexOf("---", 3);
    if (second !== -1) return raw.slice(second + 3).trimStart();
  }
  return raw;
}

function getMarkdownContent(filename: string): string {
  const key = `../content/articles/${filename}`;
  return stripFrontmatter(contentModules[key] ?? "");
}

/** Convert :video{}/:audio{} directives to markdown image syntax for ReactMarkdown. */
function expandMediaDirectives(raw: string): string {
  return raw
    .replace(/:video\{src="([^"]+)"(?:\s+title="([^"]*)")?\s*\}/g, (_, src, title) =>
      `![${title || "Video"}](${src} "video")`
    )
    .replace(/:audio\{src="([^"]+)"(?:\s+title="([^"]*)")?\s*\}/g, (_, src, title) =>
      `![${title || "Audio"}](${src} "audio")`
    );
}

export function Post() {
  const { slug } = useParams<{ slug: string }>();
  const { authHeaders } = useAuth();

  const published = publishedArticles.find((a) => a.slug === slug);

  // Draft preview: if the slug is not a published article, try to load it
  // with the admin token so authenticated editors can preview drafts.
  const [draft, setDraft] = useState<{ article: Article; content: string } | null>(null);
  const [draftChecked, setDraftChecked] = useState(false);

  useEffect(() => {
    if (published || !slug) {
      setDraftChecked(true);
      return;
    }
    let cancelled = false;
    fetch(`/api/articles/${encodeURIComponent(slug)}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && data.status === "draft") {
          setDraft({
            article: {
              id: data.id ?? slug,
              slug,
              title: data.title ?? slug,
              excerpt: data.excerpt ?? "",
              coverImage: data.coverImage ?? "",
              date: data.date ?? "",
              readTime: data.readTime ?? "",
              author: defaultAuthor,
              tags: data.tags ?? [],
              status: "draft",
              contentFile: "",
            },
            content: data.content ?? "",
          });
        }
        setDraftChecked(true);
      })
      .catch(() => setDraftChecked(true));
    return () => {
      cancelled = true;
    };
  }, [slug, published, authHeaders]);

  const article = published ?? draft?.article ?? null;

  // Reading progress bar
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  // Hero parallax
  const y = useTransform(scrollYProgress, [0, 0.4], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const content = useMemo(() => {
    if (!article) return "";
    if (draft?.content) return draft.content;
    return expandMediaDirectives(getMarkdownContent(article.contentFile));
  }, [article, draft?.content]);

  // Prev / next navigation across the published article list
  const nav = useMemo(() => {
    const idx = publishedArticles.findIndex((a) => a.slug === slug);
    if (idx === -1) return { prev: null, next: null };
    return {
      prev: idx > 0 ? publishedArticles[idx - 1] : null,
      next: idx < publishedArticles.length - 1 ? publishedArticles[idx + 1] : null,
    };
  }, [slug]);

  // Related articles: share at least one tag with the current article
  const related = useMemo(() => {
    if (!article) return [];
    const mine = new Set(article.tags.map((t) => t.toLowerCase()));
    return publishedArticles
      .filter((a) => a.slug !== article.slug)
      .map((a) => ({ a, score: a.tags.filter((t) => mine.has(t.toLowerCase())).length }))
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, 3)
      .map((x) => x.a);
  }, [article]);

  // 404 after we've had a chance to load a draft
  if (draftChecked && !article) {
    return <Navigate to="/404" replace />;
  }
  // Still resolving draft
  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
      </div>
    );
  }

  const ogUrl = `${siteConfig.url}/post/${article.slug}`;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Helmet>
        <title>{article.title} — {siteConfig.name}</title>
        <meta name="description" content={article.excerpt} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:image" content={article.coverImage || siteConfig.ogImage} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        {article.status === "draft" && <meta name="robots" content="noindex" />}
        {article.coverImage && <link rel="preload" as="image" href={article.coverImage} />}
      </Helmet>
      <Header />

      {/* Reading progress bar */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-accent"
      />

      <main className="flex-1">
        {/* Immersive Hero */}
        <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden bg-ink">
          {article.coverImage && (
            <motion.div style={{ y, opacity }} className="absolute inset-0">
              <FadeImage
                src={article.coverImage}
                alt={article.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-60"
              />
            </motion.div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12 md:p-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-4xl"
            >
              {article.status === "draft" && (
                <span className="mb-4 inline-block rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink">
                  Draft Preview
                </span>
              )}
              <div className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-paper/80">
                <span>{article.date}</span>
                {article.tags[0] && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-paper/40"></span>
                    <span>{article.tags[0]}</span>
                  </>
                )}
                {article.readTime && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-paper/40"></span>
                    <span>{article.readTime}</span>
                  </>
                )}
              </div>

              <h1 className="font-serif text-4xl font-medium leading-tight tracking-tight text-paper sm:text-5xl md:text-6xl lg:text-7xl">
                {article.title}
              </h1>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="prose prose-lg prose-stone max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-ink-light prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
          >
            {article.excerpt && (
              <p className="lead text-2xl font-serif italic text-ink mb-12">
                {article.excerpt}
              </p>
            )}

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {content}
            </ReactMarkdown>
          </motion.div>

          <AuthorInfo author={article.author} />

          {/* Prev / Next */}
          <nav className="mt-16 flex flex-col gap-4 border-t border-ink/10 pt-10 sm:flex-row sm:items-stretch sm:justify-between">
            {nav.prev ? (
              <Link
                to={`/post/${nav.prev.slug}`}
                className="group flex max-w-md flex-1 flex-col gap-2"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-light group-hover:text-accent transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </span>
                <span className="font-serif text-lg text-ink group-hover:text-accent transition-colors">
                  {nav.prev.title}
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block flex-1" />
            )}
            {nav.next ? (
              <Link
                to={`/post/${nav.next.slug}`}
                className="group flex max-w-md flex-1 flex-col items-end gap-2 text-right"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-light group-hover:text-accent transition-colors">
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <span className="font-serif text-lg text-ink group-hover:text-accent transition-colors">
                  {nav.next.title}
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block flex-1" />
            )}
          </nav>

          {/* Related articles */}
          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="mb-8 text-sm font-semibold uppercase tracking-wider text-ink">
                Related Reading
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    to={`/post/${r.slug}`}
                    className="group flex flex-col gap-3"
                  >
                    <div className="overflow-hidden rounded-sm bg-ink/5 aspect-[16/10]">
                      {r.coverImage && (
                        <FadeImage
                          src={r.coverImage}
                          alt={r.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <span className="font-serif text-base leading-snug text-ink group-hover:text-accent transition-colors">
                      {r.title}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}

/** Map markdown elements to custom components, stripping frontmatter. */
const markdownComponents: ComponentProps<typeof ReactMarkdown>["components"] = {
  hr: () => null,

  blockquote({ children }) {
    let author = "";

    function extractText(nodes: unknown): string {
      if (typeof nodes === "string") return nodes;
      if (Array.isArray(nodes)) return nodes.map(extractText).join("");
      if (nodes && typeof nodes === "object" && "props" in nodes) {
        const props = nodes as { props?: { children?: unknown } };
        return extractText(props.props?.children);
      }
      return "";
    }

    const fullText = extractText(children);
    const lines = fullText.split("\n").filter(Boolean);
    const lastLine = lines[lines.length - 1]?.trim() ?? "";
    if (lastLine.startsWith("— ")) {
      author = lastLine.replace(/^—\s*/, "");
      lines.pop();
    }

    const quoteText = lines.join("\n").trim();
    return <QuoteEmbed quote={quoteText} author={author || undefined} />;
  },

  img({ src, alt, title }) {
    if (!src) return null;
    if (title === "video") {
      return <VideoEmbed src={src} title={alt ?? undefined} />;
    }
    if (title === "audio") {
      return <AudioEmbed src={src} title={alt ?? undefined} />;
    }
    const size = (title as "default" | "wide" | "full" | undefined) || "default";
    return <ImageEmbed src={src} alt={alt ?? ""} caption={alt ?? undefined} size={size} />;
  },

  p({ children }) {
    // Skip rendering empty paragraphs or paras that contain only an hr-like element
    if (!children) return null;
    // Don't wrap ImageEmbed in a <p>
    const childArray = Array.isArray(children) ? children : [children];
    const isBlockChild = childArray.some(
      (c) => typeof c === "object" && c && "type" in c && typeof c.type === "function"
    );
    if (isBlockChild) return <>{children}</>;
    return <p>{children}</p>;
  },
};
