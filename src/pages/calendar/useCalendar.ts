import { useState, useMemo } from 'react'
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  addDays, addWeeks, addMonths, subDays, subWeeks, subMonths,
  format, isSameDay, eachDayOfInterval, getHours, getMinutes,
} from 'date-fns'
import { pt } from 'date-fns/locale'

export type CalendarView = 'day' | 'multiBarb' | 'week' | 'month'

export const HOUR_START = 8   // 08:00
export const HOUR_END   = 20  // 20:00
export const SLOT_HEIGHT = 60 // px per hour

export function useCalendar() {
  const [view, setView] = useState<CalendarView>('day')
  const [currentDate, setCurrentDate] = useState(new Date())

  const navigate = (dir: 'prev' | 'next' | 'today') => {
    if (dir === 'today') { setCurrentDate(new Date()); return }
    const delta = dir === 'next' ? 1 : -1
    setCurrentDate(prev => {
      if (view === 'day')        return dir === 'next' ? addDays(prev, 1)    : subDays(prev, 1)
      if (view === 'week')       return dir === 'next' ? addWeeks(prev, 1)   : subWeeks(prev, 1)
      if (view === 'month')      return dir === 'next' ? addMonths(prev, 1)  : subMonths(prev, 1)
      return prev
    })
    void delta
  }

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end   = endOfWeek(currentDate,   { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end   = endOfWeek(endOfMonth(currentDate),     { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
    []
  )

  const title = useMemo(() => {
    if (view === 'day')
      return format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: pt })
    if (view === 'week') {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 })
      const e = endOfWeek(currentDate,   { weekStartsOn: 1 })
      return `${format(s, 'd MMM', { locale: pt })} – ${format(e, 'd MMM yyyy', { locale: pt })}`
    }
    return format(currentDate, 'MMMM yyyy', { locale: pt })
  }, [view, currentDate])

  return { view, setView, currentDate, setCurrentDate, navigate, weekDays, monthDays, hours, title }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function aptTop(startsAt: string): number {
  const d = new Date(startsAt)
  return ((getHours(d) - HOUR_START) + getMinutes(d) / 60) * SLOT_HEIGHT
}

export function aptHeight(startsAt: string, endsAt: string): number {
  const diff = (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 3_600_000
  return Math.max(diff * SLOT_HEIGHT, 24)
}

export function slotToTime(y: number, containerTop: number): string {
  const rel    = y - containerTop
  const hours  = Math.floor(rel / SLOT_HEIGHT) + HOUR_START
  const mins   = Math.round((rel % SLOT_HEIGHT) / SLOT_HEIGHT * 60 / 15) * 15
  const h      = Math.min(Math.max(hours, HOUR_START), HOUR_END - 1)
  const m      = mins >= 60 ? 0 : mins
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

export function isTodayCheck(date: Date) { return isSameDay(date, new Date()) }
