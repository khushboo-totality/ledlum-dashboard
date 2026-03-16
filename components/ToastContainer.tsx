'use client'

import { useToast } from '@/context/ToastContext'

const STYLES = {
  success: { dot: 'bg-green-500', bar: 'border-l-green-500' },
  error:   { dot: 'bg-primary',   bar: 'border-l-primary' },
  info:    { dot: 'bg-secondary', bar: 'border-l-secondary' },
  warning: { dot: 'bg-yellow-500', bar: 'border-l-yellow-500' },
}

export default function ToastContainer() {
  const { toasts } = useToast()
  return (
    <div className="fixed bottom-7 right-7 z-[9000] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`animate-toast-in flex items-center gap-3 bg-white border border-gray border-l-4 rounded-lg px-4 py-3.5 shadow-modal min-w-[260px] font-bai text-sm text-foreground ${STYLES[t.type].bar}`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STYLES[t.type].dot}`} />
          {t.message}
        </div>
      ))}
    </div>
  )
}
