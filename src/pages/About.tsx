import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { defaultAuthor } from "../data/articles";
import { FadeImage } from "../components/FadeImage";
import { siteConfig } from "../data/site-config";

export function About() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Helmet>
        <title>About — {siteConfig.name}</title>
        <meta name="description" content={defaultAuthor.bio} />
        <meta property="og:title" content={`About — ${siteConfig.name}`} />
        <meta property="og:description" content={defaultAuthor.bio} />
        <meta property="og:image" content={siteConfig.ogImage} />
        <meta property="og:url" content={`${siteConfig.url}/about`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <Header />
      <main className="flex-1">
        <article className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row gap-12 lg:gap-20 items-start"
          >
            <div className="w-full md:w-1/2">
              <div className="aspect-[4/5] overflow-hidden rounded-sm bg-ink/5 sticky top-24">
                <FadeImage 
                  src={defaultAuthor.avatar}
                  alt={defaultAuthor.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="w-full md:w-1/2 flex flex-col justify-center pt-8 md:pt-0">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium text-ink mb-8 tracking-tight">
                About
              </h1>
              <div className="prose prose-stone prose-lg prose-p:leading-relaxed prose-p:text-ink-light">
                <p className="text-2xl font-serif italic text-ink mb-8 leading-snug">
                  {defaultAuthor.bio}
                </p>
                <p>
                  I'm a high school student who spends a lot of free time tinkering with code, taking apart old electronics, and trying to understand how the physical world fits together. This site is where I share what I'm working on and what I'm learning along the way.
                </p>
                <p>
                  When I'm not buried in a textbook or debugging something, you'll find me outdoors — hiking trails, watching birds, staring at clouds, or just paying attention to the small details in nature that are easy to miss.
                </p>
                <p>
                  I believe the best way to learn is to build and to ask questions — especially the ones that don't have easy answers. If you're into any of this too, I'd love to connect.
                </p>
              </div>

              <div className="mt-16 pt-12 border-t border-ink/10">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink mb-6">Connect & Inquiries</h3>
                <div className="flex flex-col gap-4">
                  <a href={siteConfig.social.email} className="text-ink-light hover:text-accent transition-colors font-medium">{siteConfig.social.email.replace("mailto:", "")}</a>
                  <a href={siteConfig.social.twitter} target="_blank" rel="noreferrer" className="text-ink-light hover:text-accent transition-colors font-medium">Twitter: {defaultAuthor.twitter}</a>
                  <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer" className="text-ink-light hover:text-accent transition-colors font-medium">Instagram: {defaultAuthor.instagram}</a>
                </div>
              </div>
            </div>
          </motion.div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
