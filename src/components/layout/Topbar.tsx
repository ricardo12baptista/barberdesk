import { Bell, Sun, Moon, Globe, LogOut, Scissors } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'

export function Topbar() {
  const { t, i18n } = useTranslation()
  const { logout } = useAuthStore()
  const { theme, setTheme, language, setLanguage } = useUIStore()

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const toggleLanguage = () => {
    const next = language === 'pt' ? 'en' : 'pt'
    setLanguage(next)
    i18n.changeLanguage(next)
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-30">

      {/* Mobile: logo — Desktop: date */}
      <div className="flex items-center gap-2">
        {/* Logo only on mobile (sidebar hidden) */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Scissors className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-foreground text-base">BarberDesk</span>
        </div>
        {/* Date on desktop */}
        <span className="hidden md:block text-sm text-muted-foreground font-body">
          {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleLanguage}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={t(`language.${language === 'pt' ? 'en' : 'pt'}`)}
        >
          <Globe className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        <div className="w-px h-5 bg-border mx-1 hidden md:block" />

        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-lg hidden md:flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title={t('auth.logout')}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
