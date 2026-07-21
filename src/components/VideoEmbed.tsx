import { cn } from "../lib/utils";

interface VideoEmbedProps {
  src: string;
  title?: string;
  size?: "default" | "wide" | "full";
}

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    return null;
  } catch {
    return null;
  }
}

function getVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("vimeo.com")) {
      const match = u.pathname.match(/^\/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function VideoEmbed({ src, title, size = "default" }: VideoEmbedProps) {
  return (
    <figure
      className={cn(
        "my-16 mx-auto",
        size === "default" && "max-w-4xl px-4 sm:px-6 lg:px-8",
        size === "wide" && "max-w-6xl px-4 sm:px-6 lg:px-8",
        size === "full" && "w-full max-w-none",
      )}
    >
      <div className="relative w-full overflow-hidden rounded-sm bg-ink/5" style={{ aspectRatio: "16/9" }}>
        {getYouTubeId(src) ? (
          <iframe
            src={`https://www.youtube.com/embed/${getYouTubeId(src)}`}
            title={title ?? "YouTube video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : getVimeoId(src) ? (
          <iframe
            src={`https://player.vimeo.com/video/${getVimeoId(src)}`}
            title={title ?? "Vimeo video"}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          // Direct video file
          <video
            src={src}
            controls
            className="absolute inset-0 h-full w-full object-contain bg-ink"
            title={title}
          />
        )}
      </div>
      {title && (
        <figcaption className="mt-4 text-center text-sm italic text-ink-light">{title}</figcaption>
      )}
    </figure>
  );
}
