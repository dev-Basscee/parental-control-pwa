import { LogOut } from 'lucide-react'

export function LogoutButton ({ onLogout }: { onLogout: () => void }) {
  return (
    <button
      onClick={onLogout}
      className="p-2 rounded-xl text-blue-300 hover:bg-white/10 hover:text-white transition-colors"
      aria-label="Logout"
    >
      <LogOut className="w-5 h-5" />
    </button>
  )
}
