import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ScrollToTop } from "./components/ScrollToTop";

const Home = lazy(() => import("./pages/Home").then((m) => ({ default: m.Home })));
const Post = lazy(() => import("./pages/Post").then((m) => ({ default: m.Post })));
const About = lazy(() => import("./pages/About").then((m) => ({ default: m.About })));
const Photography = lazy(() => import("./pages/Photography").then((m) => ({ default: m.Photography })));
const Archive = lazy(() => import("./pages/Archive").then((m) => ({ default: m.Archive })));
const TagPage = lazy(() => import("./pages/TagPage").then((m) => ({ default: m.TagPage })));
const NotFound = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFound })));
const Admin = lazy(() => import("./pages/Admin").then((m) => ({ default: m.Admin })));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/photography" element={<Photography />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/tag/:tag" element={<TagPage />} />
            <Route path="/post/:slug" element={<Post />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  );
}
