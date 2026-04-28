import { useState, useMemo } from 'react'
import { format, isSameDay } from 'date-fns'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { useAppStore } from '@/stores/app.store'
import { useAppointments, useEmployees, useLocations, useClientsFlat, useServices, useUpdateAppointment } from '@/hooks'
import { useCalendar, type CalendarView } from './useCalendar'
import { useIsMobile } from '@/hooks/useIsMobile'
import { CalendarToolbar } from './components/CalendarToolbar'
import { TimeGrid } from './components/TimeGrid'
import { MonthView } from './components/MonthView'
import { MobileAgenda } from './components/MobileAgenda'
import { AppointmentModal } from './components/AppointmentModal'
import { PageHeader } from '@/components/ui'
import type { Appointment } from '@/models'

// ─── Vistas disponíveis por role ─────────────────────────────────────────────
//
//  day       → Vista Unificada: 1 coluna, dia inteiro, marcações de todos os barbeiros
//              cor por barbeiro, sobreposição lado a lado quando há conflito de horário
//
//  multiBarb → Vista Multi-Barbeiro: 1 coluna por barbeiro, scroll lateral se > N barbeiros
//              cor por status (o barbeiro já está identificado pelo header da coluna)
//              só disponível para managers/admin com ≥ 2 barbeiros
//
//  week      → Vista Semana: 1 coluna por dia (Seg→Dom), filtro de barbeiro nos pills
//
//  month     → Vista Mês: grelha mensal, click num dia vai para Vista Dia

function getAvailableViews(role: string, isSoloOwner: boolean, totalBarbers: number): CalendarView[] {
  if (role === 'employee') return ['day', 'week', 'month']
  if (isSoloOwner)         return ['day', 'week', 'month']
  // manager/super_admin with team
  const views: CalendarView[] = ['day', 'week', 'month']
  if (totalBarbers >= 2)   views.splice(1, 0, 'multiBarb')  // insert after 'day'
  return views
}

export function CalendarPage() {
  const { user } = useAuthStore()
  const { activeLocation } = useUIStore()
  const { isSoloOwner: getSoloOwner, totalBarbers } = useAppStore()

  const isSoloOwner = getSoloOwner(user?.role ?? '')
  const isEmployee  = user?.role === 'employee'
  const isMobile    = useIsMobile()

  const availableViews = getAvailableViews(user?.role ?? '', isSoloOwner, totalBarbers)

  const { view, setView, currentDate, setCurrentDate, navigate, weekDays, monthDays, hours, title } = useCalendar()
  const safeView: CalendarView = availableViews.includes(view) ? view : 'day'

  // ─── Location ─────────────────────────────────────────────────────────────
  const { data: allLocations = [] } = useLocations()
  const locationId =
    activeLocation?.id ??
    user?.locationId ??
    (user?.role === 'super_admin' ? allLocations[0]?.id : '') ??
    ''

  // ─── Modal ────────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]     = useState(false)
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [prefill, setPrefill]         = useState<{ startsAt: string; employeeId: string } | undefined>()
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | 'all'>('all')

  // ─── Data ─────────────────────────────────────────────────────────────────
  const { data: allEmployees = [] } = useEmployees(locationId)
  const { data: clients      = [] } = useClientsFlat()
  const { data: services     = [] } = useServices()
  const updateApt = useUpdateAppointment()

  const clientMap  = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])),  [clients])
  const serviceMap = useMemo(() => Object.fromEntries(services.map(s => [s.id, s])), [services])

  const visibleEmployees = useMemo(() =>
    isEmployee ? allEmployees.filter(e => e.userId === user?.id) : allEmployees,
  [allEmployees, isEmployee, user])

  const myEmployeeId = isEmployee ? visibleEmployees[0]?.id : undefined

  const dateFilter = safeView === 'day' || safeView === 'multiBarb'
    ? format(currentDate, 'yyyy-MM-dd') : undefined

  const { data: appointments = [] } = useAppointments({
    locationId: locationId || undefined,
    date:       dateFilter,
    employeeId: myEmployeeId,
  })

  const visibleApts = useMemo(() => {
    let apts = appointments
    if (selectedEmployeeId !== 'all') apts = apts.filter(a => a.employeeId === selectedEmployeeId)
    if (safeView === 'day' || safeView === 'multiBarb') return apts
    const range = safeView === 'week' ? weekDays : monthDays
    return apts.filter(a => range.some(d => isSameDay(new Date(a.startsAt), d)))
  }, [appointments, safeView, weekDays, monthDays, selectedEmployeeId])

  const gridEmployees = visibleEmployees.length > 0
    ? visibleEmployees
    : [{ id: 'self', name: user?.name ?? 'Tu', userId: user?.id ?? '', locationId, serviceIds: [], commissionPercent: 100, isActive: true }]

  // Employees shown after pill filter (week view)
  const filteredEmployees = useMemo(() =>
    selectedEmployeeId === 'all' ? gridEmployees : gridEmployees.filter(e => e.id === selectedEmployeeId),
  [gridEmployees, selectedEmployeeId])

  // ─── Handlers ────────────────────────────────────────────────────────────
  const openNew = (startsAt?: string, employeeId?: string) => {
    setSelectedApt(null)
    setPrefill(startsAt ? { startsAt, employeeId: employeeId ?? gridEmployees[0]?.id ?? '' } : undefined)
    setModalOpen(true)
  }
  const openEdit  = (apt: Appointment) => { setSelectedApt(apt); setPrefill(undefined); setModalOpen(true) }
  const handleClose = () => { setModalOpen(false); setSelectedApt(null); setPrefill(undefined) }

  const handleDrop = async (aptId: string, startsAt: string, employeeId: string) => {
    const apt = appointments.find(a => a.id === aptId)
    if (!apt) return
    const duration = new Date(apt.endsAt).getTime() - new Date(apt.startsAt).getTime()
    const newStart = new Date(startsAt)
    await updateApt.mutateAsync({
      id: aptId,
      data: { startsAt: newStart.toISOString(), endsAt: new Date(newStart.getTime() + duration).toISOString(), employeeId },
    })
  }

  const handleStatusChange = async (aptId: string, status: Appointment['status']) => {
    await updateApt.mutateAsync({ id: aptId, data: { status } })
  }

  const toolbarProps = {
    title, view: safeView, availableViews,
    onViewChange: setView, onNavigate: navigate, onNewApt: () => openNew(),
    employees: visibleEmployees, selectedEmployeeId, onEmployeeChange: setSelectedEmployeeId,
    showEmployeeFilter: safeView === 'week' && visibleEmployees.length > 1,
  }

  // ─── Mobile ───────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <MobileAgenda
          currentDate={currentDate}
          appointments={visibleApts}
          employees={gridEmployees}
          clients={clients}
          services={services}
          onDateChange={setCurrentDate}
          onAptClick={openEdit}
          onNewApt={() => openNew()}
          onStatusChange={handleStatusChange}
        />
        <AppointmentModal open={modalOpen} onClose={handleClose} appointment={selectedApt} prefill={prefill} />
      </>
    )
  }

  // ─── Desktop ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-1.5rem)] -mx-6 px-6">
      <PageHeader title="Agenda" />
      <CalendarToolbar {...toolbarProps} />

      <div className="flex-1 border border-border rounded-xl overflow-hidden bg-card flex flex-col min-h-0">
        {safeView === 'month' ? (
          <MonthView
            monthDays={monthDays}
            currentDate={currentDate}
            appointments={visibleApts}
            clientMap={clientMap}
            onDayClick={d => { setCurrentDate(d); setView('day') }}
            onAptClick={openEdit}
          />

        ) : safeView === 'day' ? (
          // Vista Dia — unificada, 1 coluna, todos os barbeiros sobrepostos com cor
          <TimeGrid
            mode="unified"
            hours={hours}
            days={[currentDate]}
            employees={gridEmployees}
            appointments={visibleApts}
            onSlotClick={(startsAt, empId) => openNew(startsAt, empId)}
            onAptClick={openEdit}
            onAptDrop={handleDrop}
            clientMap={clientMap}
            serviceMap={serviceMap}
          />

        ) : safeView === 'multiBarb' ? (
          // Vista Multi-barb — 1 coluna por barbeiro, scroll lateral se necessário
          <TimeGrid
            mode="multiBarb"
            hours={hours}
            days={[currentDate]}
            employees={gridEmployees}
            appointments={visibleApts}
            onSlotClick={(startsAt, empId) => openNew(startsAt, empId)}
            onAptClick={openEdit}
            onAptDrop={handleDrop}
            clientMap={clientMap}
            serviceMap={serviceMap}
          />

        ) : (
          // Vista Semana — 1 coluna por dia, pills de barbeiro opcionais
          <TimeGrid
            mode="week"
            hours={hours}
            days={weekDays}
            employees={filteredEmployees}
            appointments={visibleApts}
            onSlotClick={(startsAt, empId) => openNew(startsAt, empId)}
            onAptClick={openEdit}
            onAptDrop={handleDrop}
            clientMap={clientMap}
            serviceMap={serviceMap}
          />
        )}
      </div>

      <AppointmentModal open={modalOpen} onClose={handleClose} appointment={selectedApt} prefill={prefill} />
    </div>
  )
}
