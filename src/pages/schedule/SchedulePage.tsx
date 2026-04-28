import { useState, useEffect } from 'react'
import { Plus, Trash2, CalendarOff, Clock, Save, Loader2, CalendarDays, AlertTriangle, Settings2, User } from 'lucide-react'
import { format, parseISO, eachDayOfInterval } from 'date-fns'
import { pt } from 'date-fns/locale'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { useLocations, useEmployees } from '@/hooks'
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Spinner, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { LocationSchedule, LocationClosure } from '@/models'

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS: { dow: 0|1|2|3|4|5|6; label: string }[] = [
  { dow: 1, label: 'Segunda-feira' },
  { dow: 2, label: 'Terça-feira'   },
  { dow: 3, label: 'Quarta-feira'  },
  { dow: 4, label: 'Quinta-feira'  },
  { dow: 5, label: 'Sexta-feira'   },
  { dow: 6, label: 'Sábado'        },
  { dow: 0, label: 'Domingo'       },
]

const CLOSURE_TYPES = [
  { value: 'vacation',    label: 'Férias',      color: 'bg-blue-500/15 text-blue-400 border-blue-500/30'    },
  { value: 'holiday',     label: 'Feriado',     color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { value: 'exceptional', label: 'Encerramento',color: 'bg-red-500/15 text-red-400 border-red-500/30'       },
]

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

const ADVANCE_OPTIONS = [0, 1, 2, 3, 6, 12, 24, 48]

const inputCls = 'h-8 rounded-lg border border-input bg-muted/30 px-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

// ─── Data hooks ───────────────────────────────────────────────────────────────
function useSchedule(locationId: string) {
  const [schedule, setSchedule] = useState<LocationSchedule[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [dirty, setDirty]       = useState(false)

  useEffect(() => {
    if (!locationId) return
    setLoading(true)
    fetch(`/api/locations/${locationId}/schedule`)
      .then(r => r.json())
      .then(d => { setSchedule(d); setLoading(false) })
  }, [locationId])

  const update = (dow: number, patch: Partial<LocationSchedule>) => {
    setSchedule(p => p.map(s => s.dayOfWeek === dow ? { ...s, ...patch } : s))
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    await fetch(`/api/locations/${locationId}/schedule`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(schedule),
    })
    setSaving(false); setDirty(false)
  }

  return { schedule, loading, saving, dirty, update, save, getDay: (dow: number) => schedule.find(s => s.dayOfWeek === dow) }
}

type SettingsState = {
  horizonMode: 'rolling' | 'monthly' | 'fixed'
  rollingValue: number
  rollingUnit: 'days' | 'weeks' | 'months'
  monthlyOpenDay: number
  fixedOpenUntil: string
  minAdvanceHours: number
  slotIntervalMins: number
}

const DEFAULT_SETTINGS: SettingsState = {
  horizonMode: 'rolling', rollingValue: 30, rollingUnit: 'days',
  monthlyOpenDay: 25, fixedOpenUntil: '', minAdvanceHours: 1, slotIntervalMins: 30,
}

function useSettings(locationId: string) {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [saving, setSaving]     = useState(false)
  const [dirty, setDirty]       = useState(false)

  useEffect(() => {
    if (!locationId) return
    fetch(`/api/locations/${locationId}/settings`)
      .then(r => r.json())
      .then(d => setSettings({ ...DEFAULT_SETTINGS, ...d }))
  }, [locationId])

  const update = (patch: Partial<SettingsState>) => { setSettings(p => ({ ...p, ...patch })); setDirty(true) }

  const save = async () => {
    setSaving(true)
    await fetch(`/api/locations/${locationId}/settings`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
    })
    setSaving(false); setDirty(false)
  }

  return { settings, saving, dirty, update, save }
}

function useClosures(locationId: string) {
  const [closures, setClosures] = useState<LocationClosure[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!locationId) return
    fetch(`/api/locations/${locationId}/closures`)
      .then(r => r.json())
      .then(d => { setClosures(d); setLoading(false) })
  }, [locationId])

  const add = async (data: object) => {
    const res = await fetch(`/api/locations/${locationId}/closures`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    const created = await res.json()
    setClosures(p => [...p, created].sort((a, b) => a.startDate.localeCompare(b.startDate)))
  }

  const remove = async (id: string) => {
    await fetch(`/api/locations/${locationId}/closures/${id}`, { method: 'DELETE' })
    setClosures(p => p.filter(c => c.id !== id))
  }

  return { closures, loading, add, remove }
}

function useAbsences(locationId: string) {
  const [absences, setAbsences] = useState<any[]>([])

  useEffect(() => {
    if (!locationId) return
    fetch(`/api/locations/${locationId}/employee-absences`).then(r => r.json()).then(setAbsences)
  }, [locationId])

  const add = async (data: object) => {
    const res = await fetch(`/api/locations/${locationId}/employee-absences`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    const created = await res.json()
    setAbsences(p => [...p, created].sort((a: any, b: any) => a.startDate.localeCompare(b.startDate)))
  }

  const remove = async (id: string) => {
    await fetch(`/api/locations/${locationId}/employee-absences/${id}`, { method: 'DELETE' })
    setAbsences(p => p.filter((a: any) => a.id !== id))
  }

  return { absences, add, remove }
}

// ─── Add Closure / Absence Modal ─────────────────────────────────────────────
function AddModal({ mode, employees, onAdd, onClose }: {
  mode: 'closure' | 'absence'
  employees: { id: string; name: string }[]
  onAdd: (data: object) => Promise<void>
  onClose: () => void
}) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [form, setForm] = useState({
    startDate: today, endDate: today, reason: '', type: 'vacation', employeeId: employees[0]?.id ?? '',
  })
  const [saving, setSaving] = useState(false)

  const days = form.startDate && form.endDate >= form.startDate
    ? eachDayOfInterval({ start: parseISO(form.startDate), end: parseISO(form.endDate) }).length
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onAdd(mode === 'closure'
      ? { startDate: form.startDate, endDate: form.endDate, reason: form.reason, type: form.type }
      : { employeeId: form.employeeId, startDate: form.startDate, endDate: form.endDate, reason: form.reason }
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-bold text-foreground text-lg">
            {mode === 'closure' ? 'Novo encerramento' : 'Ausência de barbeiro'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Closure type selector */}
          {mode === 'closure' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium font-body text-foreground">Tipo</label>
              <div className="flex gap-2">
                {CLOSURE_TYPES.map(ct => (
                  <button key={ct.value} type="button"
                    onClick={() => setForm(f => ({ ...f, type: ct.value }))}
                    className={cn('flex-1 h-9 rounded-lg border text-xs font-body font-medium transition-all',
                      form.type === ct.value ? ct.color : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                  >{ct.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Employee selector for absence */}
          {mode === 'absence' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium font-body text-foreground">Barbeiro *</label>
              <select required value={form.employeeId}
                onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Data início', key: 'startDate', min: undefined },
              { label: 'Data fim',    key: 'endDate',   min: form.startDate },
            ].map(({ label, key, min }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-sm font-medium font-body text-foreground">{label} *</label>
                <input type="date" required min={min} value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </div>
          {days > 0 && (
            <p className="text-xs text-muted-foreground font-body -mt-1">
              {days} {days === 1 ? 'dia' : 'dias'}
            </p>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium font-body text-foreground">Motivo *</label>
            <input type="text" required value={form.reason}
              placeholder={mode === 'closure' ? 'Ex: Férias de Agosto, Feriado...' : 'Ex: Férias, Consulta médica...'}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              className="w-full h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" size="sm" loading={saving} className="flex-1">
              <Plus className="w-4 h-4" /> Adicionar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Closure/Absence List ─────────────────────────────────────────────────────
function ClosureList({ items, empMap, onRemove }: {
  items: any[]
  empMap?: Record<string, string>
  onRemove: (id: string) => void
}) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const upcoming = items.filter(c => c.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))
  const past     = items.filter(c => c.endDate <  today).sort((a, b) => b.startDate.localeCompare(a.startDate))

  if (items.length === 0) return (
    <div className="text-center py-8">
      <CalendarDays className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground font-body">Nenhum registo.</p>
    </div>
  )

  const renderItem = (item: any, isPast = false) => {
    const ct       = CLOSURE_TYPES.find(t => t.value === item.type)
    const start    = parseISO(item.startDate)
    const end      = parseISO(item.endDate)
    const sameDay  = item.startDate === item.endDate
    const days     = eachDayOfInterval({ start, end }).length
    const isActive = item.startDate <= today && item.endDate >= today

    return (
      <div key={item.id} className={cn(
        'flex items-start gap-3 p-3 rounded-xl border transition-colors',
        isPast     ? 'border-border bg-muted/5 opacity-60'             : '',
        isActive   ? 'border-amber-500/30 bg-amber-500/5'              : '',
        !isPast && !isActive ? 'border-border bg-muted/10'             : '',
      )}>
        {isActive && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {ct && <span className={cn('text-[10px] font-body font-medium px-1.5 py-0.5 rounded border', ct.color)}>{ct.label}</span>}
            {item.employeeId && empMap && (
              <span className="text-[10px] font-body px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground">
                {empMap[item.employeeId] ?? item.employeeId}
              </span>
            )}
            {isActive && <span className="text-[10px] text-amber-400 font-body">Em curso</span>}
          </div>
          <p className="text-sm font-body font-medium text-foreground">{item.reason}</p>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {sameDay
              ? format(start, "d 'de' MMMM 'de' yyyy", { locale: pt })
              : `${format(start, "d 'de' MMM", { locale: pt })} – ${format(end, "d 'de' MMM yyyy", { locale: pt })} · ${days} dias`
            }
          </p>
        </div>
        {!isPast && (
          <button onClick={() => onRemove(item.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
          ><Trash2 className="w-3.5 h-3.5" /></button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {upcoming.map(item => renderItem(item))}
      {past.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-muted-foreground font-body cursor-pointer hover:text-foreground transition-colors select-none py-1">
            {past.length} registo{past.length !== 1 ? 's' : ''} anterior{past.length !== 1 ? 'es' : ''}
          </summary>
          <div className="mt-1.5 space-y-1.5">{past.map(item => renderItem(item, true))}</div>
        </details>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function SchedulePage() {
  const { user }            = useAuthStore()
  const { activeLocation }  = useUIStore()
  const { data: locations = [] } = useLocations()

  const isSuperAdmin = user?.role === 'super_admin'

  const [selectedLocId, setSelectedLocId] = useState('')
  useEffect(() => {
    setSelectedLocId(activeLocation?.id ?? user?.locationId ?? locations[0]?.id ?? '')
  }, [activeLocation, user, locations])

  const selectedLoc = locations.find(l => l.id === selectedLocId)

  const sched    = useSchedule(selectedLocId)
  const sets     = useSettings(selectedLocId)
  const closures = useClosures(selectedLocId)
  const absences = useAbsences(selectedLocId)

  const { data: employees = [] } = useEmployees(selectedLocId)
  const empMap = Object.fromEntries(employees.map(e => [e.id, e.name]))

  const [modal, setModal] = useState<'closure' | 'absence' | null>(null)

  const hasUnsaved = sched.dirty || sets.dirty

  return (
    <div>
      <PageHeader
        title="Agenda da Loja"
        subtitle={selectedLoc?.name}
        actions={hasUnsaved ? (
          <div className="flex gap-2">
            {sched.dirty && (
              <Button size="sm" onClick={sched.save} loading={sched.saving}>
                <Save className="w-4 h-4" /> Guardar horário
              </Button>
            )}
            {sets.dirty && (
              <Button size="sm" variant="outline" onClick={sets.save} loading={sets.saving}>
                <Save className="w-4 h-4" /> Guardar definições
              </Button>
            )}
          </div>
        ) : undefined}
      />

      {/* Location selector — super_admin only */}
      {isSuperAdmin && locations.length > 1 && (
        <div className="mb-6">
          <select value={selectedLocId} onChange={e => setSelectedLocId(e.target.value)}
            className="h-9 rounded-xl border border-border bg-card px-3 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      )}

      {sched.loading ? <Spinner /> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Weekly Schedule ──────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-muted-foreground" /> Horário semanal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5 px-4">
              {DAYS.map(({ dow, label }) => {
                const day    = sched.getDay(dow)
                const isOpen = day?.isOpen ?? false
                return (
                  <div key={dow} className={cn(
                    'flex items-center gap-2 px-2 py-2 rounded-lg transition-all',
                    isOpen ? 'bg-muted/20' : 'opacity-40'
                  )}>
                    <button type="button" onClick={() => sched.update(dow, { isOpen: !isOpen })}
                      className={cn('relative w-10 h-5 rounded-full flex-shrink-0 transition-colors', isOpen ? 'bg-primary' : 'bg-muted')}
                    >
                      <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', isOpen ? 'translate-x-5' : 'translate-x-0.5')} />
                    </button>
                    <span className={cn('text-sm font-body w-32 flex-shrink-0', isOpen ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                      {label}
                    </span>
                    {isOpen ? (
                      <div className="flex items-center gap-2 ml-auto">
                        <select value={day?.openTime ?? '09:00'} onChange={e => sched.update(dow, { openTime: e.target.value })} className={inputCls}>
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className="text-xs text-muted-foreground">–</span>
                        <select value={day?.closeTime ?? '19:00'} onChange={e => sched.update(dow, { closeTime: e.target.value })} className={inputCls}>
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    ) : (
                      <span className="ml-auto text-xs text-muted-foreground font-body">Fechado</span>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-5">

            {/* ── Booking Settings ─────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="w-4 h-4 text-muted-foreground" /> Abertura de agenda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Mode selector */}
                <div className="space-y-2">
                  <label className="text-xs font-body font-semibold uppercase tracking-wide text-muted-foreground">
                    Modo de abertura
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'rolling',   label: 'Rolling',    desc: 'Próximos X dias/semanas/meses'      },
                      { value: 'monthly',   label: 'Mensal',     desc: 'Abre no dia X para o mês seguinte'  },
                      { value: 'fixed',     label: 'Data fixa',  desc: 'Aberta até uma data específica'     },
                    ] as const).map(opt => (
                      <button
                        key={opt.value} type="button"
                        onClick={() => sets.update({ horizonMode: opt.value })}
                        className={cn(
                          'flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 text-left transition-all',
                          sets.settings.horizonMode === opt.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/40 hover:bg-muted/30'
                        )}
                      >
                        <span className={cn('text-sm font-body font-semibold',
                          sets.settings.horizonMode === opt.value ? 'text-primary' : 'text-foreground'
                        )}>{opt.label}</span>
                        <span className="text-[10px] font-body text-muted-foreground leading-tight">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rolling options */}
                {sets.settings.horizonMode === 'rolling' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-body font-semibold uppercase tracking-wide text-muted-foreground">
                      Janela de marcação
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number" min={1} max={365}
                        value={sets.settings.rollingValue}
                        onChange={e => sets.update({ rollingValue: Math.max(1, Number(e.target.value)) })}
                        className="w-20 h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <select value={sets.settings.rollingUnit}
                        onChange={e => sets.update({ rollingUnit: e.target.value as any })}
                        className="flex-1 h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="days">Dias</option>
                        <option value="weeks">Semanas</option>
                        <option value="months">Meses</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-body">
                      Cliente pode marcar até {sets.settings.rollingValue} {
                        sets.settings.rollingUnit === 'days'   ? 'dias'    :
                        sets.settings.rollingUnit === 'weeks'  ? 'semanas' : 'meses'
                      } à frente.
                    </p>
                  </div>
                )}

                {/* Monthly options */}
                {sets.settings.horizonMode === 'monthly' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-body font-semibold uppercase tracking-wide text-muted-foreground">
                      A agenda abre no dia
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number" min={1} max={28}
                        value={sets.settings.monthlyOpenDay}
                        onChange={e => sets.update({ monthlyOpenDay: Math.min(28, Math.max(1, Number(e.target.value))) })}
                        className="w-20 h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-sm font-body text-muted-foreground">de cada mês para o mês seguinte</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-body">
                      Ex: no dia {sets.settings.monthlyOpenDay} de Junho abre a agenda de Julho.
                    </p>
                  </div>
                )}

                {/* Fixed date */}
                {sets.settings.horizonMode === 'fixed' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-body font-semibold uppercase tracking-wide text-muted-foreground">
                      Aberta até
                    </label>
                    <input
                      type="date"
                      value={sets.settings.fixedOpenUntil}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={e => sets.update({ fixedOpenUntil: e.target.value })}
                      className="w-full h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-[11px] text-muted-foreground font-body">
                      O cliente só pode marcar até esta data. Ideal para abrir a agenda por épocas.
                    </p>
                  </div>
                )}

                {/* Min advance — always shown */}
                <div className="space-y-1.5 pt-1 border-t border-border">
                  <label className="text-xs font-body font-semibold uppercase tracking-wide text-muted-foreground">
                    Antecedência mínima
                  </label>
                  <select value={sets.settings.minAdvanceHours}
                    onChange={e => sets.update({ minAdvanceHours: Number(e.target.value) })}
                    className="w-full h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {ADVANCE_OPTIONS.map(h => (
                      <option key={h} value={h}>{h === 0 ? 'Sem limite' : h === 1 ? '1 hora antes' : `${h} horas antes`}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground font-body">
                    {sets.settings.minAdvanceHours === 0
                      ? 'O cliente pode marcar até ao último momento.'
                      : `Marcações com menos de ${sets.settings.minAdvanceHours}h de antecedência não são aceites.`
                    }
                  </p>
                </div>

              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* ── Location Closures ────────────────────────────────────── */}
              <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarOff className="w-4 h-4 text-muted-foreground" /> Encerramentos da loja
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setModal('closure')}>
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent>
                <ClosureList items={closures.closures} onRemove={closures.remove} />
              </CardContent>
            </Card>

              {/* ── Employee Absences ────────────────────────────────────── */}
              <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="w-4 h-4 text-muted-foreground" /> Ausências de barbeiros
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setModal('absence')} disabled={employees.length === 0}>
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent>
                <ClosureList items={absences.absences} empMap={empMap} onRemove={absences.remove} />
              </CardContent>
            </Card>

            </div>
          </div>
        </div>
      )}

      {modal && (
        <AddModal
          mode={modal}
          employees={employees}
          onAdd={modal === 'closure' ? closures.add : absences.add}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
