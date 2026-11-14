"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const FALLBACK_IMAGE = "/icon-192x192.png";

type FallbackImageProps = Omit<ImageProps, "src" | "onError"> & {
  src?: ImageProps["src"] | null;
  fallbackSrc?: ImageProps["src"] | null;
};

/** Client-side image fallback that is safe to render from Server Components. */
export default function FallbackImage({ src, fallbackSrc, ...props }: FallbackImageProps) {
  const primarySrc = src || FALLBACK_IMAGE;
  const [currentSrc, setCurrentSrc] = useState<ImageProps["src"]>(primarySrc);

  useEffect(() => {
    setCurrentSrc(primarySrc);
  }, [primarySrc]);

  const handleError = () => {
    setCurrentSrc((current) => {
      if (fallbackSrc && current !== fallbackSrc) return fallbackSrc;
      return FALLBACK_IMAGE;
    });
  };

  return <Image {...props} src={currentSrc} onError={handleError} />;
}
