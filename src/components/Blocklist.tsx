import { useState } from 'react'
import { Plus, Shield } from 'lucide-react'
import { api, BlockedApp } from '@/lib/api'
import { BlockListItem } from './BlockListItem'
import { AddBlockModal } from './AddBlockModal'

interface Props {
  blocklist: BlockedApp[]
  agentOnline: boolean
  onUpdate: () => void
}

export function Blocklist ({ blocklist, agentOnline, onUpdate }: Props) {
  const [showModal, setShowModal] = useState(false)

  const active  = blocklist.filter((a) => a.blockType === 'indefinite' || (a.timeRemaining !== undefined && a.timeRemaining > 0))
  const expired = blocklist.filter((a) => a.blockType === 'until_timestamp' && a.timeRemaining !== undefined && a.timeRemaining <= 0)

  const handleAdd = async (processName: string, displayName: string, minutes: number) => {
    await api.addToBlocklist(processName, displayName, minutes)
    setShowModal(false)
    onUpdate()
  }

  const handleRemove = async (id: string) => {
    await api.removeFromBlocklist(id)
    onUpdate()
  }

  return (
    <div className="space-y-5">
      <button
        id="block-new-app-btn"
        onClick={() => setShowModal(true)}
        disabled={!agentOnline}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:translate-y-0"
        title={!agentOnline ? 'Agent must be running to block apps' : undefined}
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} /> Block New App
      </button>

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active ({active.length})</h2>
          {active.map((app) => (
            <BlockListItem key={app.id} app={app} onRemove={handleRemove} agentOnline={agentOnline} />
          ))}
        </section>
      )}

      {expired.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expired</h2>
          {expired.map((app) => (
            <BlockListItem key={app.id} app={app} onRemove={handleRemove} agentOnline={agentOnline} isExpired />
          ))}
        </section>
      )}

      {blocklist.length === 0 && (
        <div className="text-center py-16">
          <div className="relative mx-auto mb-5 w-20 h-20">
            <div className="absolute inset-0 bg-emerald-100 rounded-3xl rotate-6" />
            <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 w-20 h-20 flex items-center justify-center">
              <Shield className="w-9 h-9 text-emerald-500" strokeWidth={1.5} />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">All Clear</h3>
          <p className="text-gray-400 text-sm">No apps are currently blocked.</p>
        </div>
      )}

      <AddBlockModal isOpen={showModal} onClose={() => setShowModal(false)} onAdd={handleAdd} />
    </div>
  )
}
