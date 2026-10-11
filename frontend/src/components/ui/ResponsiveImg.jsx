import { useState } from 'react'

/** "/images/feature-meal" + [640, 1200] -> "/images/feature-meal-640.webp 640w, ..." */
function srcSetFor(base, widths) {
  return widths.map(w => `${base}-${w}.webp ${w}w`).join(', ')
}

/**
 * WebP image with srcset (built by frontend/scripts/optimize_images.py).
 * - `sizes` tells the browser how wide it renders, so phones fetch the small file
 * - off-screen images load lazily; pass `priority` for the one image above the fold
 * - width/height reserve space so nothing jumps while loading; it fades in when ready
 */
export default function ResponsiveImg({
  base, widths, sizes, alt = '', width, height, priority = false, className = '', onError,
}) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={`${base}-${widths[0]}.webp`}
      srcSet={srcSetFor(base, widths)}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={`rimg${loaded ? ' is-loaded' : ''} ${className}`}
      onLoad={() => setLoaded(true)}
      onError={onError}
    />
  )
}
