import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  onLogout: () => void
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
  return (
    <button
      onClick={onLogout}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-foreground"
      aria-label="Logout"
    >
      <LogOut className="w-6 h-6" />
    </button>
  )
}
