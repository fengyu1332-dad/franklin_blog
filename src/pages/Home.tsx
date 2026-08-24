import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { publishedArticles } from "../data/articles";
import { ArticleCard } from "../components/ArticleCard";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { siteConfig } from "../data/site-config";

export function Home() {
  const featuredArticle = publishedArticles[0];
  const remainingArticles = publishedArticles.slice(1);
  const hasArticles = publishedArticles.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Helmet>
        <title>{siteConfig.title}</title>
        <meta name="description" content={siteConfig.description} />
        <meta property="og:title" content={siteConfig.title} />
        <meta property="og:description" content={siteConfig.description} />
        <meta property="og:image" content={siteConfig.ogImage} />
        <meta property="og:url" content={siteConfig.url} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-16 max-w-3xl"
          >
            <h1 className="font-serif text-5xl font-medium leading-tight tracking-tight text-ink sm:text-6xl md:text-7xl">
              Notes on a <span className="italic text-accent">quieter</span> life.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink-light sm:text-xl">
              Essays, photography, and reflections on finding meaning in the spaces between the noise.
            </p>
          </motion.div>
          
          {hasArticles ? (
            <ArticleCard article={featuredArticle} featured index={0} />
          ) : (
            <p className="text-lg text-ink-light">
              No essays yet — check back soon.
            </p>
          )}
        </section>
        
        {/* Latest Articles */}
        {hasArticles && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between border-b border-ink/10 pb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink">
              Latest Entries
            </h2>
            <Link to="/archive" className="text-sm font-medium uppercase tracking-wider text-accent hover:text-ink transition-colors">
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-2">
            {remainingArticles.map((article, idx) => (
              <ArticleCard key={article.id} article={article} index={idx + 1} />
            ))}
          </div>
        </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
