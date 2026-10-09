'use client'

import { useState } from 'react'
import ProfileForm from './account/ProfileForm'
import ChangePassword from './account/ChangePassword'
import QuoteRecipientsSettings from './QuoteRecipientsSettings'

type SettingsTab = 'profile' | 'quotes'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'profile', label: 'My Profile' },
  { id: 'quotes',  label: 'Quote Recipients' },
]

/** Admin → Settings: own profile & password, and app-wide quote recipients. */
export default function AdminSettings() {
  const [tab, setTab] = useState<SettingsTab>('profile')

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-[#ece8e0] p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold font-bai transition-all ${
              tab === t.id ? 'bg-white text-primary shadow-sm' : 'text-gray-text hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-5">
          <ProfileForm />
          <ChangePassword />
        </div>
      )}
      {tab === 'quotes' && <QuoteRecipientsSettings />}
    </div>
  )
}
