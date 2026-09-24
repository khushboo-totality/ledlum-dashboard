'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { skipImageOptimization } from '@/lib/auth'

// Quality per display context — small thumbs can be compressed much harder
// than the detail hero without any visible difference at their size.
const QUALITY = { thumb: 55, card: 70, hero: 82 } as const

type Props = Omit<ImageProps, 'src' | 'quality' | 'placeholder' | 'fill'> & {
  src: string
  /** Picks the compression level; resolution itself comes from `sizes`. */
  variant?: keyof typeof QUALITY
}

/**
 * Two-stage image: a ~16px copy from the optimizer (well under 1 KB) shows
 * instantly, blurred, while next/image loads the version sized for the
 * slot via `sizes`/srcset — then fades in over it. Always `fill`, so the
 * parent must be `relative` with a size.
 */
export default function ProgressiveImage({ src, variant = 'card', className = '', onLoad, alt, ...rest }: Props) {
  const [loaded, setLoaded] = useState(false)
  const unoptimized = skipImageOptimization(src)
  const tiny = unoptimized ? null : `/_next/image?url=${encodeURIComponent(src)}&w=16&q=30`

  return (
    <>
      {tiny && !loaded && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tiny}
          alt=""
          aria-hidden
          className={`pointer-events-none absolute inset-0 h-full w-full scale-105 blur-md ${className}`}
        />
      )}
      <Image
        {...rest}
        src={src}
        alt={alt}
        fill
        quality={QUALITY[variant]}
        unoptimized={unoptimized}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={e => { setLoaded(true); onLoad?.(e) }}
      />
    </>
  )
}
