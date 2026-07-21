interface AudioEmbedProps {
  src: string;
  title?: string;
}

function getSoundCloudUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("soundcloud.com")) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23D96C4A&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false`;
    }
    return null;
  } catch {
    return null;
  }
}

export function AudioEmbed({ src, title }: AudioEmbedProps) {
  const scUrl = getSoundCloudUrl(src);

  return (
    <figure className="my-16 mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
      {scUrl ? (
        <iframe
          src={scUrl}
          title={title ?? "SoundCloud audio"}
          className="w-full rounded-sm"
          style={{ height: 166 }}
          allow="autoplay"
        />
      ) : (
        <div className="rounded-sm border border-ink/10 bg-paper p-6">
          {title && (
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-ink-light">
              {title}
            </p>
          )}
          <audio src={src} controls className="w-full" />
        </div>
      )}
      {title && scUrl && (
        <figcaption className="mt-4 text-center text-sm italic text-ink-light">{title}</figcaption>
      )}
    </figure>
  );
}
