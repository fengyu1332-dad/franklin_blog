import { useParams, Navigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ArticleCard } from "../components/ArticleCard";
import { articles } from "../data/articles";
import { siteConfig } from "../data/site-config";

export function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = tag ? decodeURIComponent(tag) : "";

  const filtered = articles.filter((a) =>
    a.tags.some((t) => t.toLowerCase() === decodedTag.toLowerCase())
  );

  if (!decodedTag) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Helmet>
        <title>{decodedTag} — {siteConfig.name}</title>
        <meta name="description" content={`${filtered.length} essays tagged with "${decodedTag}".`} />
        <meta property="og:title" content={`${decodedTag} — ${siteConfig.name}`} />
        <meta property="og:description" content={`${filtered.length} essays tagged with "${decodedTag}".`} />
        <meta property="og:image" content={siteConfig.ogImage} />
        <meta property="og:url" content={`${siteConfig.url}/tag/${encodeURIComponent(decodedTag)}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-16 max-w-3xl"
          >
            <h1 className="font-serif text-5xl font-medium leading-tight tracking-tight text-ink sm:text-6xl">
              <span className="italic text-accent">{decodedTag}</span>
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-light sm:text-xl">
              {filtered.length} {filtered.length === 1 ? "essay" : "essays"} tagged with "{decodedTag}".
            </p>
            <Link to="/archive" className="mt-6 inline-block text-sm font-medium uppercase tracking-wider text-ink-light hover:text-accent transition-colors">
              &larr; All Essays
            </Link>
          </motion.div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2">
              {filtered.map((article, idx) => (
                <ArticleCard key={article.id} article={article} index={idx} />
              ))}
            </div>
          ) : (
            <p className="text-ink-light text-lg">No essays found for this tag.</p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
