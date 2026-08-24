import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Helmet>
        <title>404 — Page Not Found</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <p className="font-serif text-8xl font-medium text-accent">404</p>
          <h1 className="mt-6 font-serif text-3xl font-medium text-ink">Page not found</h1>
          <p className="mt-4 text-ink-light max-w-md mx-auto">
            The page you are looking for does not exist or has been moved. Perhaps you would like to return to the essays?
          </p>
          <Link
            to="/"
            className="mt-8 inline-block text-sm font-medium uppercase tracking-wider text-accent hover:text-ink transition-colors"
          >
            &larr; Back Home
          </Link>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
