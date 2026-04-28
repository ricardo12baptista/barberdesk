import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AppointmentStatus, ClientTag, Role } from '@/models'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, locale = 'pt-PT') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value)
}

export function formatDate(date: string | Date | null | undefined, locale = 'pt-PT') {
  if (!date) return '-'
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) return '-'
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'long', year: 'numeric' }).format(parsedDate)
}

export function formatTime(date: string | Date | null | undefined, locale = 'pt-PT') {
  if (!date) return '--:--'
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) return '--:--'
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(parsedDate)
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(0)}%`
}

export const statusColors: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  confirmed: 'bg-green-500/15 text-green-500 border-green-500/30',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  no_show: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

export const tagColors: Record<ClientTag, string> = {
  vip: 'bg-amber-500/15 text-amber-500',
  new: 'bg-green-500/15 text-green-500',
  loyal: 'bg-blue-500/15 text-blue-400',
  at_risk: 'bg-red-500/15 text-red-400',
  blacklisted: 'bg-slate-500/15 text-slate-400',
}

export const roleColors: Record<Role, string> = {
  super_admin: 'bg-primary/15 text-primary',
  manager: 'bg-violet-500/15 text-violet-400',
  employee: 'bg-sky-500/15 text-sky-400',
  partner: 'bg-emerald-500/15 text-emerald-400',
}

export function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function getDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m}min` : `${h}h`
}
