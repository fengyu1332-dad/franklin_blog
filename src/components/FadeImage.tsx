import { useState, useEffect, useRef } from "react";
import { cn } from "../lib/utils";

export function FadeImage({ className, src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setHasError(false);
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={src}
      className={cn(
        "transition-all duration-700 ease-out",
        isLoaded ? "opacity-100 blur-0" : "opacity-0 blur-md",
        hasError && "!opacity-100 !blur-0 bg-ink/5 object-contain p-4",
        className
      )}
      onLoad={() => setIsLoaded(true)}
      onError={() => {
        setHasError(true);
        setIsLoaded(true);
      }}
      {...props}
    />
  );
}
