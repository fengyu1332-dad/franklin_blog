import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ArticleCard } from "../components/ArticleCard";
import { publishedArticles } from "../data/articles";
import { siteConfig } from "../data/site-config";

export function Archive() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Helmet>
        <title>All Essays — {siteConfig.name}</title>
        <meta name="description" content="Every story, reflection, and essay — arranged in chronological order." />
        <meta property="og:title" content={`All Essays — ${siteConfig.name}`} />
        <meta property="og:description" content="Every story, reflection, and essay — arranged in chronological order." />
        <meta property="og:image" content={siteConfig.ogImage} />
        <meta property="og:url" content={`${siteConfig.url}/archive`} />
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
              All Essays
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-light sm:text-xl">
              Every story, reflection, and essay — arranged in chronological order.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2">
            {publishedArticles.map((article, idx) => (
              <ArticleCard key={article.id} article={article} index={idx} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
