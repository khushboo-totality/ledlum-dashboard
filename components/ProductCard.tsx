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
}

export default function ProductCard({ product, index, onClick, onEdit, onDelete, hasDetail }: ProductCardProps) {
  const { can } = useAuth()
  const [imgError, setImgError] = useState(false)
  const imgUrl = getImageUrl(product.ImageLink)
  const delay  = `${(index % 24) * 0.03}s`
  const showAdminActions = can('edit') || can('delete')

  return (
    <div
      className="group bg-white border border-gray rounded-xl overflow-visible cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:border-primary/30 animate-card-in relative"
      style={{ animationDelay: delay }}
      onClick={onClick}
    >
      {/* Image area — isolated so its overflow-hidden doesn't clip the card */}
      <div className="aspect-square bg-gray rounded-t-xl overflow-hidden relative flex items-center justify-center">
        {imgUrl && !imgError ? (
          <Image
            src={imgUrl}
            alt={product.Codes}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04] pointer-events-none"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 pointer-events-none select-none">
            <svg className="opacity-20" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="text-[10px] text-gray-dark font-bai uppercase tracking-wide">No Image</span>
          </div>
        )}

        {/* Badges — pointer-events-none so they don't block clicks */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide font-pop ${
            product.source === 'external' ? 'bg-green-100 text-green-700' : 'bg-black/60 text-white'
          }`}>
            {product.source}
          </span>
          {hasDetail && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide font-pop bg-primary text-white">
              Configure
            </span>
          )}
        </div>

        {/* Vendor hover hint — pointer-events-none */}
        {can('cart') && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="bg-primary text-white text-xs font-bold font-bai px-3 py-1.5 rounded-full shadow-lg translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
              + Add to Quote
            </span>
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="px-4 pt-3 pb-3">
        <div className="text-sm font-bold text-foreground font-bai tracking-wide truncate">{product.Codes}</div>
        <div className="text-xs text-gray-text font-pop mt-0.5">{product.Category}</div>
      </div>

      {/* Admin action buttons — rendered in normal flow, not max-h trick */}
      {showAdminActions && (
        <div
          className="px-3 pb-3 grid gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ gridTemplateColumns: can('edit') && can('delete') ? '1fr 1fr' : '1fr' }}
          onClick={e => e.stopPropagation()}
        >
          {can('edit') && (
            <button
              onClick={e => { e.stopPropagation(); onEdit() }}
              className="py-1.5 text-xs font-semibold font-bai border border-gray-mid rounded-lg text-gray-text hover:border-primary hover:text-primary transition-colors"
            >
              Edit
            </button>
          )}
          {can('delete') && (
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              className="py-1.5 text-xs font-semibold font-bai border border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
