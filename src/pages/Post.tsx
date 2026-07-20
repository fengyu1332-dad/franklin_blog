import { useParams, Navigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import { useMemo, type ComponentProps } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { articles } from "../data/articles";
import { siteConfig } from "../data/site-config";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AuthorInfo } from "../components/AuthorInfo";
import { QuoteEmbed } from "../components/QuoteEmbed";
import { ImageEmbed } from "../components/ImageEmbed";
import { FadeImage } from "../components/FadeImage";

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

export function Post() {
  const { slug } = useParams<{ slug: string }>();
  const article = articles.find((a) => a.slug === slug);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  const content = useMemo(() => {
    if (!article) return "";
    return getMarkdownContent(article.contentFile);
  }, [article]);

  if (!article) {
    return <Navigate to="/" replace />;
  }

  const ogUrl = `${siteConfig.url}/post/${article.slug}`;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Helmet>
        <title>{article.title} — {siteConfig.name}</title>
        <meta name="description" content={article.excerpt} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:image" content={article.coverImage} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <Header />

      <main className="flex-1">
        {/* Immersive Hero */}
        <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden bg-ink">
          <motion.div style={{ y, opacity }} className="absolute inset-0">
            <FadeImage
              src={article.coverImage}
              alt={article.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover opacity-60"
            />
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12 md:p-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-4xl"
            >
              <div className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-paper/80">
                <span>{article.date}</span>
                <span className="h-1 w-1 rounded-full bg-paper/40"></span>
                <span>{article.tags[0]}</span>
                <span className="h-1 w-1 rounded-full bg-paper/40"></span>
                <span>{article.readTime}</span>
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
            <p className="lead text-2xl font-serif italic text-ink mb-12">
              {article.excerpt}
            </p>

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {content}
            </ReactMarkdown>
          </motion.div>

          <AuthorInfo author={article.author} />
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
    const textParts: string[] = [];
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
