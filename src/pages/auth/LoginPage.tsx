import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, logout } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [blocked, setBlocked] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBlocked(false)
    const ok = await login(email, password)
    if (!ok) return
    // super_admin é exclusivo do backoffice — bloqueado na app dos barbeiros
    if (useAuthStore.getState().user?.role === 'super_admin') {
      logout()
      setBlocked(true)
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-foreground text-xl tracking-tight">BarberDesk</span>
        </div>

        <div className="w-full">
          <h1 className="font-display font-bold text-foreground text-2xl mb-1">Bem-vindo</h1>
          <p className="text-sm text-muted-foreground font-body mb-8">Entra na tua conta</p>

          {blocked && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive font-body">
              Esta conta de proprietário (super_admin) é exclusiva do backoffice.
              Usa a plataforma de gestão em <span className="font-semibold">/admin</span>.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium font-body text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome@barbearia.pt"
                required
                className="w-full h-10 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium font-body text-foreground mb-1.5">Palavra-passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-10 rounded-lg border border-input bg-muted/30 px-3 pr-10 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive font-body">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {isLoading ? 'A entrar…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
