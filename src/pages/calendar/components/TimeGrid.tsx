import { useRef } from 'react'
import { format, isSameDay } from 'date-fns'
import { HOUR_START, HOUR_END, SLOT_HEIGHT, aptTop, aptHeight } from '../useCalendar'
import { cn } from '@/lib/utils'
import type { Appointment, Client, Employee, Service } from '@/models'

interface Props {
  hours:        number[]
  days:         Date[]
  employees:    Employee[]
  appointments: Appointment[]
  mode: 'unified' | 'multiBarb' | 'week'
  clientMap?:   Record<string, Client>
  serviceMap?:  Record<string, Service>
  onSlotClick:  (startsAt: string, employeeId: string) => void
  onAptClick:   (apt: Appointment) => void
  onAptDrop:    (aptId: string, startsAt: string, employeeId: string) => void
}

const EMP_COLORS = [
  { border: 'border-indigo-500',  bg: 'bg-indigo-500/20',  text: 'text-indigo-300',  dot: 'bg-indigo-500'  },
  { border: 'border-emerald-500', bg: 'bg-emerald-500/20', text: 'text-emerald-300', dot: 'bg-emerald-500' },
  { border: 'border-rose-500',    bg: 'bg-rose-500/20',    text: 'text-rose-300',    dot: 'bg-rose-500'    },
  { border: 'border-amber-500',   bg: 'bg-amber-500/20',   text: 'text-amber-300',   dot: 'bg-amber-500'   },
  { border: 'border-sky-500',     bg: 'bg-sky-500/20',     text: 'text-sky-300',     dot: 'bg-sky-500'     },
  { border: 'border-violet-500',  bg: 'bg-violet-500/20',  text: 'text-violet-300',  dot: 'bg-violet-500'  },
  { border: 'border-pink-500',    bg: 'bg-pink-500/20',    text: 'text-pink-300',    dot: 'bg-pink-500'    },
  { border: 'border-teal-500',    bg: 'bg-teal-500/20',    text: 'text-teal-300',    dot: 'bg-teal-500'    },
]

const STATUS_BG: Record<string, string> = {
  pending:     'bg-amber-500/20  border-amber-500  text-amber-300',
  confirmed:   'bg-green-500/20  border-green-500  text-green-300',
  in_progress: 'bg-blue-500/20   border-blue-500   text-blue-300',
  completed:   'bg-indigo-500/20 border-indigo-500 text-indigo-300',
  cancelled:   'bg-red-500/20    border-red-500    text-red-300   opacity-50',
  no_show:     'bg-slate-500/20  border-slate-500  text-slate-400 opacity-50',
}

function yToTime(relativeY: number): string {
  const totalH   = HOUR_END - HOUR_START
  const clamped  = Math.max(0, Math.min(relativeY, totalH * SLOT_HEIGHT - 1))
  const rawHours = clamped / SLOT_HEIGHT
  const h        = Math.floor(rawHours) + HOUR_START
  const mins     = Math.round((rawHours % 1) / (15 / 60)) * 15
  const hh       = Math.min(h, HOUR_END - 1)
  const mm       = mins >= 60 ? 0 : mins
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function computeUnifiedLayout(apts: Appointment[]): Map<string, { left: number; width: number }> {
  const sorted = [...apts].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  const layout = new Map<string, { left: number; width: number }>()
  const clusters: Appointment[][] = []
  for (const apt of sorted) {
    const start = new Date(apt.startsAt).getTime()
    let placed  = false
    for (const cluster of clusters) {
      const clusterEnd = Math.max(...cluster.map(a => new Date(a.endsAt).getTime()))
      if (start < clusterEnd) { cluster.push(apt); placed = true; break }
    }
    if (!placed) clusters.push([apt])
  }
  for (const cluster of clusters) {
    const n = cluster.length
    cluster.forEach((apt, i) => layout.set(apt.id, { left: (i / n) * 100, width: 100 / n }))
  }
  return layout
}

// ─── Shared: time gutter column ──────────────────────────────────────────────
function TimeGutter({ hours, totalHeight, sticky = false }: { hours: number[]; totalHeight: number; sticky?: boolean }) {
  return (
    <div
      className={cn(
        'w-16 flex-shrink-0 border-r border-border relative bg-card',
        sticky && 'sticky left-0 z-20'
      )}
      style={{ height: totalHeight }}
    >
      {hours.map(h => (
        <div key={h} style={{ top: (h - HOUR_START) * SLOT_HEIGHT }} className="absolute left-0 right-0 flex justify-end pr-2">
          <span className="text-[10px] font-mono text-muted-foreground/60 tabular-nums leading-none pt-1">
            {String(h).padStart(2, '0')}:00
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Shared: hour grid lines ─────────────────────────────────────────────────
function HourLines({ hours }: { hours: number[] }) {
  return <>
    {hours.map(h => (
      <div key={h} style={{ top: (h - HOUR_START) * SLOT_HEIGHT }}
        className="absolute left-0 right-0 border-t border-border/30 pointer-events-none" />
    ))}
    {hours.map(h => (
      <div key={`${h}h`} style={{ top: (h - HOUR_START) * SLOT_HEIGHT + SLOT_HEIGHT / 2 }}
        className="absolute left-0 right-0 border-t border-border/15 border-dashed pointer-events-none" />
    ))}
  </>
}

export function TimeGrid({ hours, days, employees, appointments, mode, clientMap = {}, serviceMap = {}, onSlotClick, onAptClick, onAptDrop }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragging  = useRef<string | null>(null)
  const totalHeight = (HOUR_END - HOUR_START) * SLOT_HEIGHT

  const empColorMap = Object.fromEntries(employees.map((e, i) => [e.id, EMP_COLORS[i % EMP_COLORS.length]]))

  // Y position relative to the scrollable container (accounts for scroll offset)
  const getRelativeY = (clientY: number): number => {
    if (!scrollRef.current) return 0
    return clientY - scrollRef.current.getBoundingClientRect().top + scrollRef.current.scrollTop
  }

  const now    = new Date()
  const nowTop = ((now.getHours() - HOUR_START) + now.getMinutes() / 60) * SLOT_HEIGHT
  const showNow = nowTop >= 0 && nowTop <= totalHeight

  // Bloquear cliques em slots de dias/horários já passados — não abre o modal
  const handleSlotClick = (day: Date, empId: string, e: React.MouseEvent) => {
    const time = yToTime(getRelativeY(e.clientY))
    const slotDate = new Date(`${format(day, 'yyyy-MM-dd')}T${time}:00`)
    if (slotDate.getTime() < now.getTime()) return
    onSlotClick(`${format(day, 'yyyy-MM-dd')}T${time}:00`, empId)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UNIFIED — Vista Dia: 1 coluna, todos os barbeiros sobrepostos
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'unified') {
    const date    = days[0]
    const isToday = isSameDay(date, new Date())
    const apts    = appointments.filter(a => isSameDay(new Date(a.startsAt), date))
    const layout  = computeUnifiedLayout(apts)

    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* Legenda de barbeiros */}
        {employees.length > 1 && (
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border flex-shrink-0 bg-muted/20 flex-wrap">
            <span className="text-[10px] text-muted-foreground/50 font-display uppercase tracking-wider">Barbeiros:</span>
            {employees.map(emp => (
              <div key={emp.id} className="flex items-center gap-1.5">
                <div className={cn('w-2 h-2 rounded-full', empColorMap[emp.id]?.dot ?? 'bg-primary')} />
                <span className="text-xs font-body text-muted-foreground">{emp.name}</span>
              </div>
            ))}
          </div>
        )}

        {/*
          ── Key structural fix ──────────────────────────────────────────────
          Header row is INSIDE the scroll container, pinned with sticky top-0.
          This guarantees header and columns are always the same width —
          the scrollbar only affects their shared container, not one side.
        */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {/* Sticky header */}
          <div className="sticky top-0 z-30 flex border-b border-border bg-card">
            <div className="w-16 flex-shrink-0 border-r border-border" />
            <div className={cn('flex-1 h-10 flex items-center justify-center', isToday && 'bg-primary/5')}>
              <span className={cn('text-xs font-display font-semibold', isToday ? 'text-primary' : 'text-muted-foreground')}>
                {format(date, 'EEEE, d MMMM')}
              </span>
            </div>
          </div>

          {/* Body row */}
          <div className="flex">
            <TimeGutter hours={hours} totalHeight={totalHeight} />
            <div
              className={cn('flex-1 relative', isToday && 'bg-primary/[0.015]')}
              style={{ height: totalHeight }}
              onClick={e => handleSlotClick(date, employees[0]?.id ?? '', e)}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
              onDrop={e => {
                e.preventDefault()
                if (!dragging.current) return
                const time   = yToTime(getRelativeY(e.clientY))
                const empId  = appointments.find(a => a.id === dragging.current)?.employeeId ?? employees[0]?.id ?? ''
                onAptDrop(dragging.current, `${format(date, 'yyyy-MM-dd')}T${time}:00`, empId)
                dragging.current = null
              }}
            >
              <HourLines hours={hours} />
              {showNow && isToday && (
                <div style={{ top: nowTop }} className="absolute left-0 right-0 z-10 pointer-events-none flex items-center">
                  <div className="w-2 h-2 rounded-full bg-primary -ml-1 flex-shrink-0" />
                  <div className="flex-1 h-px bg-primary opacity-70" />
                </div>
              )}
              {apts.map(apt => {
                const pos = layout.get(apt.id) ?? { left: 0, width: 100 }
                const c   = empColorMap[apt.employeeId]
                const emp = employees.find(e => e.id === apt.employeeId)
                return (
                  <div key={apt.id} draggable
                    onDragStart={e => { dragging.current = apt.id; e.dataTransfer.effectAllowed = 'move'; e.stopPropagation() }}
                    onDragEnd={() => { dragging.current = null }}
                    onClick={e => { e.stopPropagation(); onAptClick(apt) }}
                    style={{ top: aptTop(apt.startsAt), height: aptHeight(apt.startsAt, apt.endsAt), left: `calc(${pos.left}% + 3px)`, width: `calc(${pos.width}% - 6px)` }}
                    className={cn('absolute rounded-md border-l-2 px-1.5 py-1 overflow-hidden select-none z-20 cursor-grab active:cursor-grabbing hover:brightness-110 transition-all',
                      c ? `${c.border} ${c.bg} ${c.text}` : STATUS_BG.confirmed)}
                  >
                    <p className="text-[11px] font-display font-semibold leading-tight truncate">{clientMap[apt.clientId]?.name ?? apt.clientId}</p>
                    {emp && <p className="text-[10px] font-body leading-tight truncate opacity-70 mt-0.5">{emp.name}</p>}
                    <p className="text-[10px] font-body leading-tight truncate opacity-60">{serviceMap[apt.serviceId]?.name ?? apt.serviceId}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MULTI-BARB — 1 coluna por barbeiro, scroll horizontal + vertical
  // Header sticky dentro do mesmo scroll container → alinhamento garantido
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'multiBarb') {
    const date    = days[0]
    const COL_MIN = 140

    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/*
          ── Single scroll container for BOTH axes ──────────────────────────
          overflow-x-auto → horizontal scroll when columns exceed viewport
          overflow-y-auto → vertical scroll for time
          Header row sticky top-0, gutter sticky left-0.
          Because header lives inside the same scroll container as the columns,
          it always has the exact same width — no scrollbar offset mismatch.
        */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin">

          {/* Sticky header row */}
          <div className="sticky top-0 z-30 flex border-b border-border bg-card" style={{ minWidth: `${16 * 4 + employees.length * COL_MIN}px` }}>
            {/* Gutter spacer — matches gutter width, also sticky left */}
            <div className="w-16 flex-shrink-0 sticky left-0 z-40 bg-card border-r border-border" />
            {employees.map(emp => (
              <div
                key={emp.id}
                style={{ minWidth: COL_MIN, flex: '1 1 0' }}
                className="h-12 flex flex-col items-center justify-center border-r border-border last:border-r-0 px-2 gap-0.5"
              >
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', empColorMap[emp.id]?.dot ?? 'bg-primary')} />
                  <span className="text-xs font-display font-semibold text-foreground truncate">{emp.name}</span>
                </div>
                {(emp.serviceIds ?? []).length > 0 && (
                  <span className="text-[10px] font-body text-muted-foreground/60 truncate">
                    {(emp.serviceIds ?? []).length} serviço{(emp.serviceIds ?? []).length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Body row */}
          <div className="flex" style={{ minWidth: `${16 * 4 + employees.length * COL_MIN}px` }}>
            {/* Sticky gutter */}
            <TimeGutter hours={hours} totalHeight={totalHeight} sticky />

            {/* Employee columns */}
            {employees.map((emp, colIdx) => {
              const colApts = appointments.filter(a =>
                a.employeeId === emp.id && isSameDay(new Date(a.startsAt), date)
              )
              return (
                <div
                  key={emp.id}
                  style={{ minWidth: COL_MIN, flex: '1 1 0', height: totalHeight }}
                  className={cn('border-r border-border last:border-r-0 relative', colIdx % 2 === 1 && 'bg-muted/[0.015]')}
                  onClick={e => handleSlotClick(date, emp.id, e)}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                  onDrop={e => {
                    e.preventDefault()
                    if (!dragging.current) return
                    const time = yToTime(getRelativeY(e.clientY))
                    onAptDrop(dragging.current, `${format(date, 'yyyy-MM-dd')}T${time}:00`, emp.id)
                    dragging.current = null
                  }}
                >
                  <HourLines hours={hours} />
                  {showNow && (
                    <div style={{ top: nowTop }} className="absolute left-0 right-0 z-10 pointer-events-none flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary -ml-1 flex-shrink-0" />
                      <div className="flex-1 h-px bg-primary opacity-70" />
                    </div>
                  )}
                  {colApts.map(apt => (
                    <div key={apt.id} draggable
                      onDragStart={e => { dragging.current = apt.id; e.dataTransfer.effectAllowed = 'move'; e.stopPropagation() }}
                      onDragEnd={() => { dragging.current = null }}
                      onClick={e => { e.stopPropagation(); onAptClick(apt) }}
                      style={{ top: aptTop(apt.startsAt), height: aptHeight(apt.startsAt, apt.endsAt), left: 3, right: 3 }}
                      className={cn('absolute rounded-md border-l-2 px-1.5 py-1 overflow-hidden select-none z-20 cursor-grab active:cursor-grabbing hover:brightness-110 transition-all',
                        STATUS_BG[apt.status] ?? STATUS_BG.confirmed)}
                    >
                      <p className="text-[11px] font-display font-semibold leading-tight truncate">{clientMap[apt.clientId]?.name ?? apt.clientId}</p>
                      <p className="text-[10px] font-body leading-tight truncate opacity-80 mt-0.5">{serviceMap[apt.serviceId]?.name ?? apt.serviceId}</p>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WEEK — 1 coluna por dia, header sticky dentro do scroll container
  // ─────────────────────────────────────────────────────────────────────────
  const showEmpLegend = employees.length > 1
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {showEmpLegend && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border flex-shrink-0 bg-muted/20 flex-wrap">
          <span className="text-[10px] text-muted-foreground/50 font-display uppercase tracking-wider">Barbeiros:</span>
          {employees.map(emp => {
            const c = empColorMap[emp.id]
            return (
              <div key={emp.id} className="flex items-center gap-1.5">
                <div className={cn('w-2 h-2 rounded-full', c?.dot ?? 'bg-primary')} />
                <span className="text-xs font-body text-muted-foreground">{emp.name}</span>
              </div>
            )
          })}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">

        {/* Sticky header */}
        <div className="sticky top-0 z-30 flex border-b border-border bg-card">
          <div className="w-16 flex-shrink-0 border-r border-border" />
          {days.map((day, i) => {
            const isToday = isSameDay(day, new Date())
            return (
              <div key={i} className={cn('flex-1 h-10 flex items-center justify-center border-r border-border last:border-r-0', isToday && 'bg-primary/5')}>
                <span className={cn('text-xs font-display font-semibold', isToday ? 'text-primary' : 'text-muted-foreground')}>
                  {format(day, 'EEE d')}
                </span>
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex">
          <TimeGutter hours={hours} totalHeight={totalHeight} />
          {days.map((day, colIdx) => {
            const isToday = isSameDay(day, new Date())
            const colApts = appointments.filter(a => isSameDay(new Date(a.startsAt), day))
            const layout  = computeUnifiedLayout(colApts)
            return (
              <div
                key={colIdx}
                className={cn('flex-1 border-r border-border last:border-r-0 relative', isToday && 'bg-primary/[0.02]')}
                style={{ height: totalHeight }}
                onClick={e => handleSlotClick(day, employees[0]?.id ?? '', e)}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                onDrop={e => {
                  e.preventDefault()
                  if (!dragging.current) return
                  const time   = yToTime(getRelativeY(e.clientY))
                  const empId  = appointments.find(a => a.id === dragging.current)?.employeeId ?? employees[0]?.id ?? ''
                  onAptDrop(dragging.current, `${format(day, 'yyyy-MM-dd')}T${time}:00`, empId)
                  dragging.current = null
                }}
              >
                <HourLines hours={hours} />
                {showNow && isToday && (
                  <div style={{ top: nowTop }} className="absolute left-0 right-0 z-10 pointer-events-none flex items-center">
                    <div className="w-2 h-2 rounded-full bg-primary -ml-1 flex-shrink-0" />
                    <div className="flex-1 h-px bg-primary opacity-70" />
                  </div>
                )}
                {colApts.map(apt => {
                  const pos = layout.get(apt.id) ?? { left: 0, width: 100 }
                  const c   = showEmpLegend ? empColorMap[apt.employeeId] : null
                  return (
                    <div key={apt.id} draggable
                      onDragStart={e => { dragging.current = apt.id; e.dataTransfer.effectAllowed = 'move'; e.stopPropagation() }}
                      onDragEnd={() => { dragging.current = null }}
                      onClick={e => { e.stopPropagation(); onAptClick(apt) }}
                      style={{ top: aptTop(apt.startsAt), height: aptHeight(apt.startsAt, apt.endsAt), left: `calc(${pos.left}% + 2px)`, width: `calc(${pos.width}% - 4px)` }}
                      className={cn('absolute rounded-md border-l-2 px-1 py-0.5 overflow-hidden select-none z-20 cursor-grab active:cursor-grabbing hover:brightness-110 transition-all',
                        c ? `${c.border} ${c.bg} ${c.text}` : (STATUS_BG[apt.status] ?? STATUS_BG.confirmed))}
                    >
                      <p className="text-[10px] font-display font-semibold leading-tight truncate">{clientMap[apt.clientId]?.name ?? apt.clientId}</p>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
