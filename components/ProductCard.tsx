'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Product } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { getImageUrl } from '@/lib/auth'

interface ProductCardProps {
  product: Product
  index: number
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  hasDetail?: boolean
  onQuickAdd?: () => void
}

export default function ProductCard({ product, index, onClick, onEdit, onDelete, hasDetail, onQuickAdd }: ProductCardProps) {
  const { can } = useAuth()
  const [imgError, setImgError] = useState(false)
  const displayCode = product.model ?? product.Codes
  const imgUrl = getImageUrl(product.hero_image ?? product.ImageLink ?? '')
  const delay  = `${(index % 24) * 0.03}s`
  const showAdminActions = can('edit') || can('delete')

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/80 bg-white shadow-card animate-card-in transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-card-hover focus-within:ring-4 focus-within:ring-primary/10"
      style={{ animationDelay: delay }}
      onClick={onClick}
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gray">
        {imgUrl && !imgError ? (
          <Image
            src={imgUrl}
            alt={displayCode}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="pointer-events-none object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="pointer-events-none flex select-none flex-col items-center gap-2 p-4">
            <svg className="opacity-20" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="text-[10px] uppercase text-gray-dark font-bai">No Image</span>
          </div>
        )}

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
          <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase shadow-sm font-pop ${
            product.source === 'external' ? 'bg-green-100 text-green-700' : 'bg-black/60 text-white'
          }`}>
            {product.source}
          </span>
          {hasDetail && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[9px] font-bold uppercase text-white shadow-sm font-pop">
              Configure
            </span>
          )}
        </div>

        {can('cart') && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="translate-y-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary shadow-lg transition-transform duration-200 group-hover:translate-y-0 font-bai">
              + Add to Quote
            </span>
          </div>
        )}
      </div>

      <div className="px-4 pb-3 pt-3">
        <div className="truncate text-sm font-extrabold tracking-wide text-foreground font-bai">{displayCode}</div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="min-w-0 truncate text-xs text-gray-text font-pop">{product.Category}</div>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray text-gray-text transition-colors group-hover:bg-primary group-hover:text-white">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>

      {showAdminActions && (
        <div
          className="grid gap-1.5 px-3 pb-3 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100"
          style={{ gridTemplateColumns: can('edit') && can('delete') ? '1fr 1fr' : '1fr' }}
          onClick={e => e.stopPropagation()}
        >
          {can('edit') && (
            <button
              onClick={e => { e.stopPropagation(); onEdit() }}
              className="rounded-lg border border-gray-mid py-1.5 text-xs font-semibold text-gray-text transition-colors hover:border-primary hover:text-primary font-bai"
            >
              Edit
            </button>
          )}
          {can('delete') && (
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              className="rounded-lg border border-primary/30 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 font-bai"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {onQuickAdd && (
        <div className="px-3 pb-3 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100" onClick={e => e.stopPropagation()}>
          <button
            onClick={e => { e.stopPropagation(); onQuickAdd() }}
            className="w-full rounded-xl bg-primary/10 py-2 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white font-bai"
          >
            + Add to Quote
          </button>
        </div>
      )}
    </div>
  )
}
