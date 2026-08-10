import { motion } from "motion/react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Lightbox } from "../components/Lightbox";
import { FadeImage } from "../components/FadeImage";
import { siteConfig } from "../data/site-config";
import { publishedPhotos } from "../data/photos";

export function Photography() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Helmet>
        <title>Photography — {siteConfig.name}</title>
        <meta name="description" content="A collection of moments captured across different cities and landscapes. Focusing on light, shadow, and the quiet spaces in between." />
        <meta property="og:title" content={`Photography — ${siteConfig.name}`} />
        <meta property="og:description" content="A collection of moments captured across different cities and landscapes." />
        <meta property="og:image" content={siteConfig.ogImage} />
        <meta property="og:url" content={`${siteConfig.url}/photography`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <h1 className="font-serif text-5xl font-medium tracking-tight text-ink md:text-6xl">
              Selected Works
            </h1>
            <p className="mt-4 text-lg text-ink-light max-w-2xl">
              A collection of moments captured across different cities and landscapes.
              Focusing on light, shadow, and the quiet spaces in between.
            </p>
          </motion.div>
        </div>

        {/* Full Bleed Masonry Grid */}
        {publishedPhotos.length > 0 && (
          <div className="w-full px-1 pb-1">
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-1 space-y-1">
              {publishedPhotos.map((photo, idx) => (
                <motion.button
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "100px" }}
                  transition={{ duration: 0.6, delay: (idx % 4) * 0.1 }}
                  onClick={() => setSelectedIndex(idx)}
                  className="group relative block w-full break-inside-avoid overflow-hidden bg-ink/5 cursor-zoom-in"
                >
                  <FadeImage
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-auto object-cover group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 w-full p-6 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 text-left">
                    <p className="text-paper font-serif text-lg tracking-wide">{photo.caption}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />

      <Lightbox
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        src={selectedIndex !== null ? publishedPhotos[selectedIndex].src : ""}
        alt={selectedIndex !== null ? publishedPhotos[selectedIndex].alt : ""}
        caption={selectedIndex !== null ? publishedPhotos[selectedIndex].caption : ""}
      />
    </div>
  );
}
