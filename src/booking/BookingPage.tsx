import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Scissors, MapPin, ChevronRight, ChevronLeft, Clock, Star, Check, User, Phone, Calendar, Loader2, Search } from 'lucide-react'
import { format, addDays, startOfDay, addMinutes, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, isAfter } from 'date-fns'
import { pt } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface PublicOrg    { id: string; name: string; slug: string; plan: string }
interface PublicLoc    { id: string; name: string; address: string; city: string }
interface PublicSvc    { id: string; name: string; durationMinutes: number; basePrice: number; category: string; color: string }
interface PublicEmp    { id: string; name: string; serviceIds: string[]; avatar?: string }
interface TimeSlot     { time: string; startsAt: string; employeeId: string; employeeName: string }

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = ['Loja', 'Serviço', 'Data & Hora', 'Os seus dados']

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
              i < current  ? 'bg-primary text-white'          : '',
              i === current ? 'bg-primary text-white ring-4 ring-primary/30 scale-110' : '',
              i > current  ? 'bg-muted text-muted-foreground' : '',
            )}>
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn(
              'text-[10px] font-body hidden sm:block whitespace-nowrap',
              i === current ? 'text-foreground font-semibold' : 'text-muted-foreground'
            )}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn(
              'w-12 sm:w-20 h-0.5 mx-1 transition-all duration-500 mb-4',
              i < current ? 'bg-primary' : 'bg-border'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Choose location within the org ───────────────────────────────────
function StepLocation({
  org, onSelect,
}: { org: PublicOrg & { locations: PublicLoc[] }; onSelect: (loc: PublicLoc) => void }) {
  // If only one location, auto-select immediately
  useEffect(() => {
    if (org.locations.length === 1) onSelect(org.locations[0])
  }, [org.locations, onSelect])

  if (org.locations.length === 1) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-1">Escolha a loja</h2>
      <p className="text-sm text-muted-foreground font-body mb-6">{org.name}</p>

      <div className="space-y-2">
        {org.locations.map(loc => (
          <button
            key={loc.id}
            onClick={() => onSelect(loc)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-foreground">{loc.name}</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">{loc.address}, {loc.city}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2: Choose service ───────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  hair: 'Cabelo', beard: 'Barba', combo: 'Combo', treatment: 'Tratamento', other: 'Outro'
}

function StepService({
  org, loc, onSelect,
}: { org: PublicOrg; loc: PublicLoc; onSelect: (svc: PublicSvc) => void }) {
  const [services, setServices] = useState<PublicSvc[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch(`/api/public/services?orgId=${org.id}`)
      .then(r => r.json())
      .then(data => { setServices(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [org.id])

  const grouped = useMemo(() =>
    services.reduce((acc, s) => {
      if (!acc[s.category]) acc[s.category] = []
      acc[s.category].push(s)
      return acc
    }, {} as Record<string, PublicSvc[]>)
  , [services])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-1">Escolha o serviço</h2>
      <p className="text-sm text-muted-foreground font-body mb-6">{loc.name}</p>

      <div className="space-y-5">
        {Object.entries(grouped).map(([cat, svcs]) => (
          <div key={cat}>
            <p className="text-[11px] font-display font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">
              {CATEGORY_LABELS[cat] ?? cat}
            </p>
            <div className="space-y-2">
              {svcs.map(svc => (
                <button
                  key={svc.id}
                  onClick={() => onSelect(svc)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: svc.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-foreground">{svc.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground font-body flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {svc.durationMinutes} min
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-bold text-foreground">{svc.basePrice}€</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 3: Choose date, barber (optional) and time slot ─────────────────────
// ─── Mini calendar component ──────────────────────────────────────────────────
function MiniCalendar({
  selected, onSelect, openDays,
}: {
  selected: Date
  onSelect: (d: Date) => void
  openDays: Set<string>   // 'yyyy-MM-dd' strings of days with availability
}) {
  const today = startOfDay(new Date())
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected))

  const days = useMemo(() => {
    const start = startOfMonth(viewMonth)
    const end   = endOfMonth(viewMonth)
    const all   = eachDayOfInterval({ start, end })
    // Pad to start on Monday
    const firstDow = (getDay(start) + 6) % 7   // 0=Mon
    const pad = Array.from({ length: firstDow }, (_, i) => addDays(start, -(firstDow - i)))
    return [...pad, ...all]
  }, [viewMonth])

  const prevMonth = () => setViewMonth(d => startOfMonth(addDays(d, -1)))
  const nextMonth = () => setViewMonth(d => startOfMonth(addDays(endOfMonth(d), 1)))

  const DOW = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

  return (
    <div className="rounded-2xl border border-border bg-card p-4 select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <p className="font-display font-semibold text-sm text-foreground capitalize">
          {format(viewMonth, 'MMMM yyyy', { locale: pt })}
        </p>
        <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map(d => (
          <div key={d} className="text-center text-[10px] font-body font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          const dateStr    = format(day, 'yyyy-MM-dd')
          const isThisMonth = isSameMonth(day, viewMonth)
          const isPast     = !isAfter(day, today) && !isSameDay(day, today)
          const isSelected = isSameDay(day, selected)
          const hasSlots   = openDays.has(dateStr)
          const isDisabled = !isThisMonth || isPast || !hasSlots

          return (
            <button
              key={i}
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelect(day)}
              className={cn(
                'relative h-9 w-full rounded-lg text-sm font-body transition-all',
                !isThisMonth  && 'opacity-0 pointer-events-none',
                isThisMonth && isDisabled && 'text-muted-foreground/30 cursor-not-allowed',
                isThisMonth && !isDisabled && !isSelected && 'hover:bg-primary/10 hover:text-primary text-foreground',
                isSelected   && 'bg-primary text-white font-semibold shadow-md shadow-primary/30',
              )}
            >
              {format(day, 'd')}
              {/* Dot indicator for days with availability */}
              {hasSlots && !isSelected && !isDisabled && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/60" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Avatar initials helper ────────────────────────────────────────────────────
const EMP_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500',   'bg-violet-500',  'bg-cyan-500',
]
function empColor(index: number) { return EMP_COLORS[index % EMP_COLORS.length] }
function initials(name: string)  { return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }

// ─── Step 3: Date, barber and time slot ───────────────────────────────────────
function StepDateTime({
  org, loc, svc, onSelect,
}: {
  org: PublicOrg; loc: PublicLoc; svc: PublicSvc
  onSelect: (slot: TimeSlot, date: Date) => void
}) {
  const today = startOfDay(new Date())

  const [employees,     setEmployees]     = useState<PublicEmp[]>([])
  const [selectedEmpId, setSelectedEmpId] = useState<string>('any')
  const [selectedDate,  setSelectedDate]  = useState<Date>(addDays(today, 1))
  const [slots,         setSlots]         = useState<TimeSlot[]>([])
  const [openDays,      setOpenDays]      = useState<Set<string>>(new Set())
  const [loadingSlots,  setLoadingSlots]  = useState(false)

  // Load employees
  useEffect(() => {
    fetch(`/api/public/employees?locationId=${loc.id}&serviceId=${svc.id}`)
      .then(r => r.json())
      .then((data: PublicEmp[]) => {
        setEmployees(data)
        // Auto-select if only one barber available
        if (data.length === 1) setSelectedEmpId(data[0].id)
      })
  }, [loc.id, svc.id])

  // Pre-fetch open days for the next 60 days to populate calendar dots
  useEffect(() => {
    const empParam = selectedEmpId === 'any' ? '' : selectedEmpId
    const promises = Array.from({ length: 60 }, (_, i) => {
      const d = format(addDays(today, i + 1), 'yyyy-MM-dd')
      return fetch(`/api/public/slots?locationId=${loc.id}&serviceId=${svc.id}&date=${d}&employeeId=${empParam}`)
        .then(r => r.json())
        .then((slots: TimeSlot[]) => slots.length > 0 ? d : null)
    })
    Promise.all(promises).then(results => {
      setOpenDays(new Set(results.filter(Boolean) as string[]))
    })
  }, [selectedEmpId, loc.id, svc.id])

  // Load slots for selected date
  useEffect(() => {
    setLoadingSlots(true)
    const dateStr  = format(selectedDate, 'yyyy-MM-dd')
    const empParam = selectedEmpId === 'any' ? '' : selectedEmpId
    fetch(`/api/public/slots?locationId=${loc.id}&serviceId=${svc.id}&date=${dateStr}&employeeId=${empParam}`)
      .then(r => r.json())
      .then(data => { setSlots(data); setLoadingSlots(false) })
      .catch(() => setLoadingSlots(false))
  }, [selectedDate, selectedEmpId, loc.id, svc.id])

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-1">Data e hora</h2>
      <p className="text-sm text-muted-foreground font-body mb-6">{svc.name} · {svc.durationMinutes} min</p>

      {/* ── Barber cards ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs font-display font-semibold uppercase tracking-widest text-muted-foreground mb-3">Barbeiro</p>
        <div className="flex gap-3 flex-wrap">

          {/* Any barber option — hidden when only 1 employee */}
          {employees.length !== 1 && <button
            onClick={() => setSelectedEmpId('any')}
            className={cn(
              'flex flex-col items-center gap-2 w-20 py-3 rounded-2xl border-2 transition-all',
              selectedEmpId === 'any'
                ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                : 'border-border hover:border-primary/40 hover:bg-muted/40'
            )}
          >
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-all',
              selectedEmpId === 'any' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            )}>
              <Star className="w-5 h-5" />
            </div>
            <span className={cn(
              'text-[11px] font-body font-medium text-center leading-tight px-1',
              selectedEmpId === 'any' ? 'text-primary' : 'text-muted-foreground'
            )}>
              Qualquer
            </span>
          </button>}

          {/* Individual barbers */}
          {employees.map((emp, idx) => (
            <button
              key={emp.id}
              onClick={() => setSelectedEmpId(emp.id)}
              className={cn(
                'flex flex-col items-center gap-2 w-20 py-3 rounded-2xl border-2 transition-all',
                selectedEmpId === emp.id
                  ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                  : 'border-border hover:border-primary/40 hover:bg-muted/40'
              )}
            >
              {emp.avatar ? (
                <img
                  src={emp.avatar}
                  alt={emp.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-offset-card transition-all"
                  style={{ ringColor: selectedEmpId === emp.id ? 'hsl(var(--primary))' : 'transparent' }}
                />
              ) : (
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all',
                  empColor(idx),
                  selectedEmpId === emp.id && 'ring-2 ring-primary ring-offset-2 ring-offset-card'
                )}>
                  {initials(emp.name)}
                </div>
              )}
              <span className={cn(
                'text-[11px] font-body font-medium text-center leading-tight px-1',
                selectedEmpId === emp.id ? 'text-primary' : 'text-muted-foreground'
              )}>
                {emp.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Calendar ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs font-display font-semibold uppercase tracking-widest text-muted-foreground mb-3">Data</p>
        <MiniCalendar
          selected={selectedDate}
          onSelect={setSelectedDate}
          openDays={openDays}
        />
      </div>

      {/* ── Time slots ────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-display font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Horários disponíveis · {format(selectedDate, "d 'de' MMMM", { locale: pt })}
        </p>
        {loadingSlots ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : slots.length === 0 ? (
          <div className="text-center py-10">
            <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-body">Sem disponibilidade neste dia.</p>
            <p className="text-xs text-muted-foreground/60 font-body mt-1">Escolha outro dia no calendário.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {slots.map(slot => (
              <button
                key={`${slot.employeeId}-${slot.time}`}
                onClick={() => onSelect(slot, selectedDate)}
                className="flex flex-col items-center justify-center h-14 rounded-xl border border-border hover:border-primary hover:bg-primary/10 transition-all group"
              >
                <span className="font-mono font-semibold text-sm text-foreground group-hover:text-primary">{slot.time}</span>
                {selectedEmpId === 'any' && employees.length > 1 && (
                  <span className="text-[9px] text-muted-foreground font-body truncate px-1 max-w-full">{slot.employeeName.split(' ')[0]}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 4: Contact details + confirm ─────────────────────────────────────────
// ─── Step 4: Contact details + confirm ───────────────────────────────────────
function StepConfirm({
  org, loc, svc, slot, date,
  onConfirmed,
}: {
  org: PublicOrg; loc: PublicLoc; svc: PublicSvc; slot: TimeSlot; date: Date
  onConfirmed: (aptId: string) => void
}) {
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [notes,   setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) { setError('Nome e telefone são obrigatórios.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/public/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: org.id,
          locationId:     loc.id,
          serviceId:      svc.id,
          employeeId:     slot.employeeId,
          startsAt:       slot.startsAt,
          clientName:     name.trim(),
          clientPhone:    phone.trim(),
          notes:          notes.trim(),
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      onConfirmed(data.appointmentId)
    } catch {
      setError('Ocorreu um erro. Por favor tente novamente.')
      setLoading(false)
    }
  }

  const endTime = format(
    addMinutes(parseISO(slot.startsAt), svc.durationMinutes), 'HH:mm'
  )

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-1">Confirmar marcação</h2>
      <p className="text-sm text-muted-foreground font-body mb-6">Só mais um passo</p>

      {/* Summary card */}
      <div className="rounded-2xl border border-border bg-muted/20 p-4 mb-6 space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: svc.color }} />
          <div>
            <p className="font-display font-bold text-foreground">{svc.name}</p>
            <p className="text-xs text-muted-foreground font-body">{loc.name}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-display font-bold text-foreground">{svc.basePrice}€</p>
          </div>
        </div>
        <div className="h-px bg-border" />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground font-body">
            <Calendar className="w-3.5 h-3.5" />
            {format(date, "d 'de' MMMM", { locale: pt })}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground font-body">
            <Clock className="w-3.5 h-3.5" />
            {slot.time} – {endTime}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground font-body col-span-2">
            <User className="w-3.5 h-3.5" />
            {slot.employeeName}
          </div>
        </div>
      </div>

      {/* Contact form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-body font-semibold text-foreground uppercase tracking-wide block mb-1.5">
            Nome completo *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={name} onChange={e => setName(e.target.value)} required
              placeholder="O seu nome"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-muted/30 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-body font-semibold text-foreground uppercase tracking-wide block mb-1.5">
            Telefone *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={phone} onChange={e => setPhone(e.target.value)} required
              placeholder="+351 9XX XXX XXX"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-muted/30 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <p className="text-[11px] text-muted-foreground font-body mt-1">
            Receberá uma confirmação por SMS.
          </p>
        </div>

        <div>
          <label className="text-xs font-body font-semibold text-foreground uppercase tracking-wide block mb-1.5">
            Notas (opcional)
          </label>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Alguma informação adicional para o barbeiro..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        {error && <p className="text-sm text-destructive font-body">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-display font-bold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          {loading ? 'A confirmar...' : 'Confirmar Marcação'}
        </button>
      </form>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
export function BookingPage() {
  const { orgSlug }  = useParams<{ orgSlug: string }>()
  const navigate     = useNavigate()

  const [orgData,  setOrgData]  = useState<(PublicOrg & { locations: PublicLoc[] }) | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [step, setStep] = useState(0)
  const [loc,  setLoc]  = useState<PublicLoc | null>(null)
  const [svc,  setSvc]  = useState<PublicSvc | null>(null)
  const [slot, setSlot] = useState<TimeSlot | null>(null)
  const [date, setDate] = useState<Date | null>(null)

  // Load org by slug on mount
  useEffect(() => {
    fetch('/api/public/organizations')
      .then(r => r.json())
      .then((orgs: (PublicOrg & { locations: PublicLoc[] })[]) => {
        const found = orgs.find(o => o.slug === orgSlug)
        if (!found) { setNotFound(true); setLoading(false); return }
        setOrgData(found)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [orgSlug])

  const handleLocSelect   = (l: PublicLoc)          => { setLoc(l);               setStep(1) }
  const handleSvcSelect   = (s: PublicSvc)           => { setSvc(s);               setStep(2) }
  const handleSlotSelect  = (sl: TimeSlot, d: Date)  => { setSlot(sl); setDate(d); setStep(3) }
  const handleConfirmed   = (aptId: string)          => navigate(`/book/confirmed/${aptId}`)

  const goBack = () => setStep(s => Math.max(0, s - 1))

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  if (notFound || !orgData) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
      <Scissors className="w-12 h-12 text-muted-foreground/30" />
      <h1 className="font-display font-bold text-xl text-foreground">Barbearia não encontrada</h1>
      <p className="text-sm text-muted-foreground font-body text-center">
        O link que seguiu não corresponde a nenhuma barbearia activa.
      </p>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center px-6 gap-3 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Scissors className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-display font-bold text-foreground">{orgData.name}</span>
        <span className="text-muted-foreground text-sm font-body ml-1">· Marcação Online</span>
        <a href="/login" className="ml-auto text-xs text-muted-foreground hover:text-foreground font-body transition-colors">
          Entrar na minha conta →
        </a>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <StepBar current={step} />

          {step > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-body mb-5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
          )}

          {step === 0 && <StepLocation org={orgData} onSelect={handleLocSelect} />}
          {step === 1 && loc && <StepService org={orgData} loc={loc} onSelect={handleSvcSelect} />}
          {step === 2 && loc && svc && (
            <StepDateTime org={orgData} loc={loc} svc={svc} onSelect={handleSlotSelect} />
          )}
          {step === 3 && loc && svc && slot && date && (
            <StepConfirm org={orgData} loc={loc} svc={svc} slot={slot} date={date} onConfirmed={handleConfirmed} />
          )}
        </div>
      </div>
    </div>
  )
}
