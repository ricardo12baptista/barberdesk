import { useEffect, useRef, useState } from 'react'
import { X, User, Scissors, Clock, CalendarDays, FileText, Euro, Trash2, Search, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useClientsFlat, useServices, useEmployees, useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from '@/hooks'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { statusColors, cn, formatCurrency, getInitials } from '@/lib/utils'
import { Button, Badge } from '@/components/ui'
import type { Appointment, AppointmentStatus } from '@/models'

interface Props {
  open: boolean
  onClose: () => void
  appointment?: Appointment | null
  prefill?: { startsAt: string; employeeId: string }
}

export function AppointmentModal({ open, onClose, appointment, prefill }: Props) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { activeLocation } = useUIStore()
  const locationId = activeLocation?.id ?? user?.locationId ?? 'loc-1'

  const { data: clients      = [] } = useClientsFlat()
  const { data: services     = [] } = useServices()
  const { data: allEmployees = [] } = useEmployees(locationId)

  const createApt  = useCreateAppointment()
  const updateApt  = useUpdateAppointment()
  const deleteApt  = useDeleteAppointment()

  const isEdit = !!appointment

  const [clientSearch,  setClientSearch]  = useState('')
  const [clientOpen,    setClientOpen]    = useState(false)
  const clientRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    clientId:   '',
    serviceId:  '',
    employeeId: '',
    date:       format(new Date(), 'yyyy-MM-dd'),
    startTime:  '09:00',
    status:     'confirmed' as AppointmentStatus,
    notes:      '',
    price:      0,
  })

  useEffect(() => {
    if (!open) return
    if (appointment) {
      const d = new Date(appointment.startsAt)
      setForm({
        clientId:   appointment.clientId,
        serviceId:  appointment.serviceId,
        employeeId: appointment.employeeId,
        date:       format(d, 'yyyy-MM-dd'),
        startTime:  format(d, 'HH:mm'),
        status:     appointment.status,
        notes:      appointment.notes ?? '',
        price:      appointment.price,
      })
    } else if (prefill) {
      const d = new Date(prefill.startsAt)
      setForm(f => ({
        ...f,
        employeeId: prefill.employeeId,
        date:       format(d, 'yyyy-MM-dd'),
        startTime:  format(d, 'HH:mm'),
      }))
    }
  }, [open, appointment, prefill])

  // Auto-fill price when service changes
  useEffect(() => {
    if (!form.serviceId) return
    const svc = services.find(s => s.id === form.serviceId)
    if (svc) setForm(f => ({ ...f, price: svc.basePrice }))
  }, [form.serviceId, services])

  const selectedService = services.find(s => s.id === form.serviceId)
  const selectedClient  = clients.find(c => c.id === form.clientId)

  // Filter employees by serviceIds association.
  // If only 1 employee exists, they do all services — no filter applied.
  const employees = form.serviceId && allEmployees.length > 1
    ? (() => {
        const filtered = allEmployees.filter(e =>
          (e.serviceIds ?? []).includes(form.serviceId)
        )
        return filtered.length > 0 ? filtered : allEmployees
      })()
    : allEmployees

  // Auto-select sole employee or clear if not in filtered list
  useEffect(() => {
    if (!form.serviceId) return
    if (employees.length === 1) {
      setForm(f => ({ ...f, employeeId: employees[0].id }))
    } else if (form.employeeId && !employees.find(e => e.id === form.employeeId)) {
      // Previously selected employee doesn't do this service — clear
      setForm(f => ({ ...f, employeeId: '' }))
    }
  }, [form.serviceId, employees.length])

  const filteredClients = clientSearch.trim().length === 0
    ? clients.slice(0, 6)   // show first 6 when no search
    : clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.phone.includes(clientSearch) ||
        (c.email ?? '').toLowerCase().includes(clientSearch.toLowerCase())
      ).slice(0, 8)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setClientOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const calcEndsAt = () => {
    const [h, m] = form.startTime.split(':').map(Number)
    const dur = selectedService?.durationMinutes ?? 30
    const total = h * 60 + m + dur
    return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const startsAt = new Date(`${form.date}T${form.startTime}:00`).toISOString()
    const [h, m] = calcEndsAt().split(':').map(Number)
    const endsDate = new Date(`${form.date}T${form.startTime}:00`)
    endsDate.setHours(h, m)
    const endsAt = endsDate.toISOString()

    const payload = {
      clientId:   form.clientId,
      serviceId:  form.serviceId,
      employeeId: form.employeeId,
      locationId,
      status:     form.status,
      notes:      form.notes,
      price:      form.price,
      startsAt,
      endsAt,
    }

    if (isEdit && appointment) {
      await updateApt.mutateAsync({ id: appointment.id, data: payload })
    } else {
      await createApt.mutateAsync(payload)
    }
    onClose()
  }

  const handleDelete = async () => {
    if (!appointment) return
    if (!confirm('Tens a certeza que queres eliminar esta marcação?')) return
    await deleteApt.mutateAsync(appointment.id)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">
              {isEdit ? 'Editar Marcação' : 'Nova Marcação'}
            </h2>
            {isEdit && (
              <Badge className={cn(statusColors[form.status], 'mt-1')}>
                {t(`appointments.status.${form.status}`)}
              </Badge>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin" style={{ overflowX: 'visible' }}>

            {/* Client — searchable combobox */}
            <div className="space-y-1.5 relative" ref={clientRef}>
              <label className="flex items-center gap-1.5 text-sm font-medium font-body text-foreground">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                {t('appointments.client')} *
              </label>

              {/* Selected client pill OR search input */}
              {selectedClient && !clientOpen ? (
                <button
                  type="button"
                  onClick={() => { setClientOpen(true); setClientSearch('') }}
                  className="w-full h-9 flex items-center gap-2.5 rounded-lg border border-input bg-muted/30 px-2.5 text-sm font-body text-foreground hover:border-ring transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-primary">{getInitials(selectedClient.name)}</span>
                  </div>
                  <span className="flex-1 text-left truncate">{selectedClient.name}</span>
                  <span className="text-xs text-muted-foreground font-body flex-shrink-0">{selectedClient.phone}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                </button>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    autoFocus={clientOpen}
                    value={clientSearch}
                    onChange={e => { setClientSearch(e.target.value); setClientOpen(true) }}
                    onFocus={() => setClientOpen(true)}
                    placeholder="Pesquisar por nome, telefone ou email..."
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-muted/30 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {/* Dropdown results */}
              {clientOpen && (
                <div className="absolute z-50 w-full max-w-[calc(32rem-3rem)] mt-1 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                  {filteredClients.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-muted-foreground font-body">Nenhum cliente encontrado.</p>
                    </div>
                  ) : (
                    <ul className="max-h-52 overflow-y-auto divide-y divide-border">
                      {filteredClients.map(c => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onMouseDown={e => {
                              e.preventDefault()
                              setForm(f => ({ ...f, clientId: c.id }))
                              setClientOpen(false)
                              setClientSearch('')
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-primary">{getInitials(c.name)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-body font-medium text-foreground truncate">{c.name}</p>
                              <p className="text-xs text-muted-foreground font-body">{c.phone}</p>
                            </div>
                            {c.tags?.includes('vip') && (
                              <span className="text-[10px] font-body px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 flex-shrink-0">VIP</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {/* Hidden required input to trigger browser validation */}
              <input type="hidden" required value={form.clientId} />
            </div>

            {/* Service */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium font-body text-foreground">
                <Scissors className="w-3.5 h-3.5 text-muted-foreground" />
                {t('appointments.service')} *
              </label>
              <select
                required
                value={form.serviceId}
                onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecionar serviço...</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes}min)</option>
                ))}
              </select>
            </div>

            {/* Employee — only shown after service is selected */}
            {/* Employee — always visible, locked until service is selected */}
            <div className="space-y-1.5">
              <label className={cn(
                "flex items-center gap-1.5 text-sm font-medium font-body",
                form.serviceId ? "text-foreground" : "text-muted-foreground"
              )}>
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                {t('appointments.employee')} *
              </label>
              {form.serviceId && employees.length === 1 ? (
                /* Single employee — read-only pill */
                <div className="w-full h-9 flex items-center gap-2 rounded-lg border border-input bg-muted/20 px-3 text-sm font-body text-muted-foreground">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-foreground">{employees[0].name}</span>
                  <span className="text-xs text-muted-foreground/60 ml-auto">único disponível</span>
                </div>
              ) : (
                <select
                  required
                  disabled={!form.serviceId}
                  value={form.employeeId}
                  onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  className={cn(
                    "w-full h-9 rounded-lg border border-input px-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
                    form.serviceId
                      ? "bg-muted/30 text-foreground cursor-pointer"
                      : "bg-muted/10 text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                >
                  <option value="">{form.serviceId ? "Selecionar barbeiro..." : "Selecione primeiro o serviço"}</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              )}
            </div>

            {/* Date + Time row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium font-body text-foreground">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                  {t('appointments.date')} *
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium font-body text-foreground">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {t('appointments.time')} *
                </label>
                <input
                  type="time"
                  required
                  value={form.startTime}
                  step="900"
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Duration info */}
            {selectedService && (
              <div className="flex items-center gap-4 px-3 py-2 rounded-lg bg-muted/40 text-xs font-body text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Duração: {selectedService.durationMinutes}min → até às {calcEndsAt()}
                </span>
                <span className="flex items-center gap-1 ml-auto">
                  <Euro className="w-3 h-3" />
                  {formatCurrency(selectedService.basePrice)}
                </span>
              </div>
            )}

            {/* Price override */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium font-body text-foreground">
                <Euro className="w-3.5 h-3.5 text-muted-foreground" />
                {t('appointments.price')}
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                className="w-full h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium font-body text-foreground">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                {t('appointments.notes')}
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Notas internas..."
                className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            {isEdit ? (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={createApt.isPending || updateApt.isPending}
              >
                {isEdit ? t('common.save') : 'Criar Marcação'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
