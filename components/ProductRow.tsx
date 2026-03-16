'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Product } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { getImageUrl } from '@/lib/auth'

interface ProductRowProps {
  product: Product
  index: number
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  hasDetail?: boolean
}

export default function ProductRow({ product, index, onClick, onEdit, onDelete, hasDetail }: ProductRowProps) {
  const { can } = useAuth()
  const [imgError, setImgError] = useState(false)
  const imgUrl = getImageUrl(product.ImageLink ?? '')
  const delay  = `${(index % 30) * 0.02}s`

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 bg-white border border-gray rounded-xl px-5 py-3.5 cursor-pointer hover:border-secondary/40 hover:bg-gray/30 transition-all animate-card-in group"
      style={{ animationDelay: delay }}
    >
      {/* Thumb */}
      <div className="w-12 h-12 rounded-lg bg-gray overflow-hidden flex-shrink-0 flex items-center justify-center relative">
        {imgUrl && !imgError ? (
          <Image src={imgUrl} alt={product.Codes} fill sizes="48px" className="object-cover" onError={() => setImgError(true)} />
        ) : (
          <svg className="opacity-20" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        )}
      </div>

      {/* Code + badges */}
      <div className="flex items-center gap-2 min-w-[160px]">
        <span className="font-bold text-sm font-bai text-foreground truncate">{product.Codes}</span>
        {hasDetail && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide font-pop bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
            Config
          </span>
        )}
      </div>

      <div className="text-sm text-gray-text font-pop flex-1">{product.Category}</div>

      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide font-pop min-w-[72px] text-center flex-shrink-0 ${
        product.source === 'external' ? 'bg-green-100 text-green-700' : 'bg-gray text-gray-dark'
      }`}>
        {product.source}
      </span>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={onClick}
          className="px-3 py-1.5 text-xs font-semibold font-bai border border-gray-mid rounded-lg text-gray-text hover:border-primary hover:text-primary transition-colors">
          {can('cart') ? '+ Quote' : 'View'}
        </button>
        {can('edit') && (
          <button onClick={onEdit}
            className="px-3 py-1.5 text-xs font-semibold font-bai border border-gray-mid rounded-lg text-gray-text hover:border-primary hover:text-primary transition-colors">
            Edit
          </button>
        )}
        {can('delete') && (
          <button onClick={onDelete}
            className="px-3 py-1.5 text-xs font-semibold font-bai border border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition-colors">
            Del
          </button>
        )}
      </div>
    </div>
  )
}
