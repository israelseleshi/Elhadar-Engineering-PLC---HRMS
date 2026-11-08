import React, { forwardRef, ImgHTMLAttributes } from "react";

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | { src: string; default?: string };
  alt?: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  quality?: number;
}

const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { src, alt = "", width, height, fill, priority, unoptimized, quality, style, className, ...props },
  ref
) {
  const imgSrc = typeof src === "object" && src !== null ? (src as any).src || (src as any).default : src;
  const combinedStyle: React.CSSProperties = fill
    ? { position: "absolute", height: "100%", width: "100%", left: 0, top: 0, right: 0, bottom: 0, objectFit: "cover", ...style }
    : { ...style };

  return (
    <img
      ref={ref}
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      style={combinedStyle}
      className={className}
      {...props}
    />
  );
});

export default Image;
