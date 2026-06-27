import { useState, useEffect } from 'react'
import { api, BlockedApp } from '@/lib/api'
import { AddBlockModal } from './AddBlockModal'
import { BlockListItem } from './BlockListItem'
import { Plus } from 'lucide-react'

interface BlocklistProps {
  blocklist: BlockedApp[]
  onUpdate: () => void
}

export function Blocklist({ blocklist, onUpdate }: BlocklistProps) {
  const [showModal, setShowModal] = useState(false)
  const [currentBlocklist, setCurrentBlocklist] = useState(blocklist)

  useEffect(() => {
    setCurrentBlocklist(blocklist)
  }, [blocklist])

  const handleAddApp = async (appName: string, duration: number) => {
    await api.addToBlocklist(appName, duration)
    setShowModal(false)
    onUpdate()
  }

  const handleRemoveApp = async (appId: string) => {
    await api.removeFromBlocklist(appId)
    onUpdate()
  }

  const activeBlocks = currentBlocklist.filter((app) => app.isBlocked)
  const expiredBlocks = currentBlocklist.filter((app) => !app.isBlocked)

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Block New App
      </button>

      {/* Active Blocks */}
      {activeBlocks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Currently Blocked</h2>
          <div className="space-y-3">
            {activeBlocks.map((app) => (
              <BlockListItem
                key={app.id}
                app={app}
                onRemove={handleRemoveApp}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expired Blocks */}
      {expiredBlocks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Previously Blocked</h2>
          <div className="space-y-3">
            {expiredBlocks.map((app) => (
              <BlockListItem
                key={app.id}
                app={app}
                onRemove={handleRemoveApp}
                isExpired={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {currentBlocklist.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">✓</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Blocked Apps</h3>
          <p className="text-muted text-sm">All apps are currently accessible</p>
        </div>
      )}

      {/* Add Block Modal */}
      <AddBlockModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddApp}
      />
    </div>
  )
}
