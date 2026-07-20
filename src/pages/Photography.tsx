import { motion } from "motion/react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Lightbox } from "../components/Lightbox";
import { FadeImage } from "../components/FadeImage";
import { siteConfig } from "../data/site-config";

const photos = [
  { src: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&h=1200&fit=crop", width: 800, height: 1200, alt: "Urban landscape", caption: "Tokyo, 2023" },
  { src: "https://images.unsplash.com/photo-1531366936337-77850807abf8?q=80&w=1200&h=800&fit=crop", width: 1200, height: 800, alt: "Mountain range", caption: "Swiss Alps" },
  { src: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&h=800&fit=crop", width: 800, height: 800, alt: "Coffee shop", caption: "Morning rituals" },
  { src: "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=1200&h=1600&fit=crop", width: 1200, height: 1600, alt: "Street photography", caption: "Shadows and light" },
  { src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&h=1000&fit=crop", width: 800, height: 1000, alt: "Portrait", caption: "Strangers" },
  { src: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=1600&h=900&fit=crop", width: 1600, height: 900, alt: "Ocean waves", caption: "Pacific coast" },
  { src: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=800&h=800&fit=crop", width: 800, height: 800, alt: "Architecture", caption: "Concrete geometry" },
  { src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&h=1200&fit=crop", width: 1000, height: 1200, alt: "Forest path", caption: "Into the woods" },
  { src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1200&h=800&fit=crop", width: 1200, height: 800, alt: "Desert dunes", caption: "Golden hour" },
  { src: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=800&h=1200&fit=crop", width: 800, height: 1200, alt: "City lights", caption: "Midnight" },
  { src: "https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?q=80&w=800&h=800&fit=crop", width: 800, height: 800, alt: "Still life", caption: "Details" },
  { src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1600&h=1200&fit=crop", width: 1600, height: 1200, alt: "Canyon", caption: "Vastness" },
];

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
        <div className="w-full px-1 pb-1">
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-1 space-y-1">
            {photos.map((photo, idx) => (
              <motion.button
                key={idx}
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
      </main>
      <Footer />

      <Lightbox 
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        src={selectedIndex !== null ? photos[selectedIndex].src : ""}
        alt={selectedIndex !== null ? photos[selectedIndex].alt : ""}
        caption={selectedIndex !== null ? photos[selectedIndex].caption : ""}
      />
    </div>
  );
}
