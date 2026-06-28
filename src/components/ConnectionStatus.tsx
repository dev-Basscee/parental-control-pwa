type AgentStatus = 'online' | 'offline' | 'checking'

export function ConnectionStatus ({ agentStatus }: { agentStatus: AgentStatus }) {
  if (agentStatus === 'online') return null

  const isChecking = agentStatus === 'checking'
  return (
    <div className={`px-4 py-2.5 border-b ${isChecking ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-200'}`}>
      <div className="max-w-2xl mx-auto flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${isChecking ? 'bg-blue-400' : 'bg-amber-500'}`} />
        <p className={`text-sm ${isChecking ? 'text-blue-700' : 'text-amber-800'}`}>
          {isChecking
            ? 'Connecting to enforcement agent…'
            : <><strong>Agent offline.</strong> Blocks won't be enforced. Run <code className="font-mono text-xs bg-amber-100 px-1 rounded">npm run agent</code>.</>
          }
        </p>
      </div>
    </div>
  )
}
