import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4">
      <Helmet>
        <title>404 — Page Not Found</title>
        <meta name="robots" content="noindex" />
      </Helmet>
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
    </div>
  );
}
