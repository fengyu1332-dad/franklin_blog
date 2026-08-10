import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { ExternalLink, Github } from "lucide-react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FadeImage } from "../components/FadeImage";
import { siteConfig } from "../data/site-config";
import { defaultAuthor } from "../data/articles";
import { publishedProjects } from "../data/lab";

export function Lab() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Helmet>
        <title>Lab — {siteConfig.name}</title>
        <meta name="description" content="实验项目与作品集" />
        <meta property="og:title" content={`Lab — ${siteConfig.name}`} />
        <meta property="og:description" content="实验项目与作品集" />
        <meta property="og:image" content={siteConfig.ogImage} />
        <meta property="og:url" content={`${siteConfig.url}/lab`} />
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
              <span className="italic text-accent">Lab</span>
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-light sm:text-xl">
              Experiments, side projects, and things I've built.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {publishedProjects.map((project, idx) => (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group"
              >
                <div className="overflow-hidden rounded-sm border border-ink/10 bg-white transition-shadow hover:shadow-lg">
                  {/* Clickable cover image — opens project URL */}
                  <a
                    href={project.url || undefined}
                    target={project.url ? "_blank" : undefined}
                    rel={project.url ? "noopener noreferrer" : undefined}
                    className="block aspect-[4/3] overflow-hidden"
                  >
                    <FadeImage
                      src={project.image}
                      alt={project.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </a>

                  <div className="p-5">
                    {/* Title — clickable if URL exists */}
                    {project.url ? (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-serif text-lg font-medium text-ink hover:text-accent transition-colors"
                      >
                        {project.title}
                        <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <h3 className="font-serif text-lg font-medium text-ink">{project.title}</h3>
                    )}

                    <p className="mt-2 text-sm leading-relaxed text-ink-light line-clamp-3">
                      {project.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink-light"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Author row — matches ArticleCard style */}
                    <div className="mt-4 flex items-center gap-3">
                      <FadeImage
                        src={defaultAuthor.avatar}
                        alt={defaultAuthor.name}
                        className="h-8 w-8 rounded-full object-cover grayscale"
                      />
                      <div>
                        <span className="text-xs font-medium">{defaultAuthor.name}</span>
                        <div className="flex items-center gap-2 text-xs text-ink-light">
                          <span>{project.date}</span>
                          {project.url && (
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-accent hover:text-ink transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Live
                            </a>
                          )}
                          {project.source && (
                            <a
                              href={project.source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-ink-light hover:text-ink transition-colors"
                            >
                              <Github className="h-3 w-3" />
                              Source
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
