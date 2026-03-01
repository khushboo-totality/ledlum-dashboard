'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Stats } from '@/types'

export default function StatsStrip() {
  const [stats, setStats] = useState<Stats | null>(null)
  const searchParams      = useSearchParams()
  const zone              = searchParams.get('zone') || ''

  useEffect(() => {
    const url = zone ? `/api/stats?zone=${zone}` : '/api/stats'
    fetch(url).then(r => r.json()).then(setStats)
  }, [zone])

  const items = [
    { num: stats?.total         ?? '—', label: 'Products'    },
    { num: stats?.withImage     ?? '—', label: 'With Image'  },
    { num: stats?.withoutImage  ?? '—', label: 'No Image'    },
    { num: stats ? Object.keys(stats.byCategory).length : '—', label: 'Categories' },
  ]

  return (
    <div className="bg-gray border-b border-gray-mid flex divide-x divide-gray-mid overflow-x-auto">
      {items.map((item, i) => (
        <div key={i} className="flex-1 min-w-[110px] py-2.5 px-5 flex flex-col items-center">
          <span className="text-xl font-bold text-primary font-bai leading-none">{item.num}</span>
          <span className="text-[11px] text-gray-text font-pop mt-0.5 whitespace-nowrap">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
