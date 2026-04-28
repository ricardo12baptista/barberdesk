import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, Eye, EyeOff, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'

// ─── Demo accounts ────────────────────────────────────────────────────────────
const DEMO_SCENARIOS = [
  {
    scenario: 'Cenário 1 — BarberKing',
    description: '5 lojas · 5 gestores · 10 barbeiros · proprietário não trabalha como barbeiro',
    plan: 'Enterprise',
    accounts: [
      {
        label:       'Proprietário',
        name:        'Ricardo Mendes',
        email:       'ricardo@barberking.pt',
        password:    'admin123',
        badge:       'super_admin',
        badgeColor:  'bg-purple-500/20 text-purple-300',
        description: 'Visão global — todas as lojas, financeiro consolidado, sem agenda própria',
      },
      {
        label:       'Gestor de Loja',
        name:        'Sofia Carvalho',
        email:       'sofia@barberking.pt',
        password:    'manager123',
        badge:       'manager',
        badgeColor:  'bg-blue-500/20 text-blue-300',
        description: 'Gere a Lisboa Baixa — agenda, equipa e financeiro da sua loja',
      },
      {
        label:       'Barbeiro',
        name:        'Tiago Costa',
        email:       'tiago@barberking.pt',
        password:    'emp123',
        badge:       'employee',
        badgeColor:  'bg-green-500/20 text-green-300',
        description: 'Vê apenas a sua agenda e os seus clientes habituais',
      },
      {
        label:       'Parceiro',
        name:        'Marco Vieira',
        email:       'marco@barberking.pt',
        password:    'partner123',
        badge:       'partner',
        badgeColor:  'bg-violet-500/20 text-violet-300',
        description: 'Trabalha na Lisboa Baixa como independente — vê a sua agenda, os seus clientes e os seus ganhos pessoais',
      },
    ],
  },
  {
    scenario: 'Cenário 2 — BarberStyle',
    description: '2 lojas · 2 gestores · 3 barbeiros · proprietário também é barbeiro',
    plan: 'Premium',
    accounts: [
      {
        label:       'Proprietário + Barbeiro',
        name:        'João Barbeiro',
        email:       'joao@barberstyle.pt',
        password:    'admin123',
        badge:       'super_admin',
        badgeColor:  'bg-purple-500/20 text-purple-300',
        description: 'Gere as 2 lojas E tem agenda própria na Boavista',
      },
      {
        label:       'Gestora de Loja',
        name:        'Marta Oliveira',
        email:       'marta@barberstyle.pt',
        password:    'manager123',
        badge:       'manager',
        badgeColor:  'bg-blue-500/20 text-blue-300',
        description: 'Gere a loja Porto Boavista',
      },
      {
        label:       'Barbeiro',
        name:        'Fábio Santos',
        email:       'fabio@barberstyle.pt',
        password:    'emp123',
        badge:       'employee',
        badgeColor:  'bg-green-500/20 text-green-300',
        description: 'Barbeiro na Porto Boavista',
      },
    ],
  },
  {
    scenario: 'Cenário 3 — CorteFino',
    description: '1 loja · 1 gestor · 1 barbeiro · proprietário também é barbeiro',
    plan: 'Pro',
    accounts: [
      {
        label:       'Proprietário + Barbeiro',
        name:        'Sérgio Matos',
        email:       'sergio@cortefino.pt',
        password:    'admin123',
        badge:       'super_admin',
        badgeColor:  'bg-purple-500/20 text-purple-300',
        description: 'Proprietário com agenda própria, mais 1 barbeiro na equipa',
      },
      {
        label:       'Gestora de Loja',
        name:        'Ana Ferreira',
        email:       'ana@cortefino.pt',
        password:    'manager123',
        badge:       'manager',
        badgeColor:  'bg-blue-500/20 text-blue-300',
        description: 'Gere o dia-a-dia da única loja',
      },
      {
        label:       'Barbeiro',
        name:        'Marco Vieira',
        email:       'marco@cortefino.pt',
        password:    'emp123',
        badge:       'employee',
        badgeColor:  'bg-green-500/20 text-green-300',
        description: 'Único barbeiro adicional na loja',
      },
    ],
  },
  {
    scenario: 'Cenário 4 — Barbearia do Zé',
    description: '1 loja · 0 colaboradores · proprietário é o único barbeiro',
    plan: 'Básico',
    accounts: [
      {
        label:       'Solo (Proprietário + Único Barbeiro)',
        name:        'José Barbeiro',
        email:       'ze@barbeariadoze.pt',
        password:    'admin123',
        badge:       'super_admin',
        badgeColor:  'bg-orange-500/20 text-orange-300',
        description: 'UI simplificada — sem equipa, sem multi-loja',
      },
    ],
  },
]

export function LoginPage() {
  const navigate  = useNavigate()
  const { login, isLoading, error } = useAuthStore()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [expanded, setExpanded] = useState<number | null>(0)  // first scenario open by default

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) navigate('/dashboard')
  }

  const fillAndLogin = async (email: string, password: string) => {
    setEmail(email)
    setPassword(password)
    const ok = await login(email, password)
    if (ok) navigate('/dashboard')
  }

  const PLAN_COLORS: Record<string, string> = {
    'Básico':     'bg-slate-500/20 text-slate-300',
    'Pro':        'bg-blue-500/20  text-blue-300',
    'Premium':    'bg-violet-500/20 text-violet-300',
    'Enterprise': 'bg-amber-500/20 text-amber-300',
  }

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Left: Login form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-foreground text-xl tracking-tight">BarberDesk</span>
        </div>

        <div className="w-full">
          <h1 className="font-display font-bold text-foreground text-2xl mb-1">Bem-vindo</h1>
          <p className="text-sm text-muted-foreground font-body mb-8">Entra na tua conta</p>

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

      {/* ── Right: Demo accounts panel ───────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[480px] border-l border-border bg-card/50 overflow-y-auto scrollbar-thin p-6">
        <div className="flex items-center gap-2 mb-1">
          <Info className="w-4 h-4 text-primary flex-shrink-0" />
          <h2 className="font-display font-bold text-foreground text-base">Contas Demo</h2>
        </div>
        <p className="text-xs text-muted-foreground font-body mb-5 ml-6">
          Clica em qualquer conta para entrar automaticamente
        </p>

        <div className="space-y-3">
          {DEMO_SCENARIOS.map((sc, si) => (
            <div key={si} className="rounded-xl border border-border overflow-hidden">
              {/* Scenario header */}
              <button
                onClick={() => setExpanded(expanded === si ? null : si)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-semibold text-foreground">{sc.scenario}</span>
                    <span className={cn('text-[10px] font-body px-1.5 py-0.5 rounded font-medium', PLAN_COLORS[sc.plan])}>
                      {sc.plan}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-body mt-0.5">{sc.description}</p>
                </div>
                {expanded === si
                  ? <ChevronUp   className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                }
              </button>

              {/* Account list */}
              {expanded === si && (
                <div className="border-t border-border divide-y divide-border">
                  {sc.accounts.map((acc, ai) => (
                    <button
                      key={ai}
                      onClick={() => fillAndLogin(acc.email, acc.password)}
                      disabled={isLoading}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left disabled:opacity-60"
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-display font-bold text-primary">
                          {acc.name.split(' ').map(n => n[0]).slice(0,2).join('')}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-display font-semibold text-foreground">{acc.name}</span>
                          <span className={cn('text-[10px] font-body px-1.5 py-0.5 rounded font-medium', acc.badgeColor)}>
                            {acc.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-body mt-0.5 leading-relaxed">
                          {acc.description}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">{acc.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
