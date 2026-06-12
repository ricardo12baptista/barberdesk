import { http, HttpResponse, delay } from 'msw'
//import type { LocationSettings } from '@/models'
import type { Appointment } from '@/models'
import {
  mockOrganizations,
  mockLocations,
  mockUsers,
  mockEmployees,
  mockClients,
  mockServices,
  mockAppointments,
  mockWorkingHours,
  mockLocationSchedules,
  mockLocationClosures,
  mockLocationSettings,
  mockEmployeeAbsences,
  
  mockCredentials,
} from './data/seed'

const API   = '/api'
const DELAY = 220

export const handlers = [

  // ─── Auth ───────────────────────────────────────────────────────────────────
  http.post(`${API}/auth/login`, async ({ request }) => {
    await delay(DELAY)
    const { email, password } = (await request.json()) as { email: string; password: string }
    const cred = mockCredentials.find(c => c.email === email && c.password === password)
    if (!cred) return HttpResponse.json({ message: 'Credenciais inválidas' }, { status: 401 })

    const user = mockUsers.find(u => u.id === cred.userId)
    if (!user) return HttpResponse.json({ message: 'Utilizador não encontrado' }, { status: 404 })

    const org = mockOrganizations.find(o => o.id === user.organizationId)
    return HttpResponse.json({ user, organization: org, token: `mock-jwt-${cred.userId}` })
  }),

  http.post(`${API}/auth/logout`, async () => {
    await delay(100)
    return HttpResponse.json({ success: true })
  }),

  // ─── Locations ──────────────────────────────────────────────────────────────
  // Always filtered by organizationId — each org only sees its own locations
  http.get(`${API}/locations`, async ({ request }) => {
    await delay(DELAY)
    const orgId = new URL(request.url).searchParams.get('organizationId')
    const result = orgId ? mockLocations.filter(l => l.organizationId === orgId) : mockLocations
    return HttpResponse.json(result)
  }),

  http.get(`${API}/locations/:id`, async ({ params }) => {
    await delay(DELAY)
    const loc = mockLocations.find(l => l.id === params.id)
    return loc ? HttpResponse.json(loc) : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),

  http.post(`${API}/locations`, async ({ request }) => {
    await delay(DELAY)
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: `loc-new-${Date.now()}`, isActive: true, ...body }, { status: 201 })
  }),

  // ─── Employees ──────────────────────────────────────────────────────────────
  http.get(`${API}/employees`, async ({ request }) => {
    await delay(DELAY)
    const locationId = new URL(request.url).searchParams.get('locationId')
    const result = locationId ? mockEmployees.filter(e => e.locationId === locationId) : mockEmployees
    return HttpResponse.json(result)
  }),

  http.get(`${API}/employees/:id`, async ({ params }) => {
    await delay(DELAY)
    const emp = mockEmployees.find(e => e.id === params.id)
    return emp ? HttpResponse.json(emp) : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),

  http.get(`${API}/employees/:id/working-hours`, async ({ params }) => {
    await delay(DELAY)
    return HttpResponse.json(mockWorkingHours.filter(h => h.employeeId === params.id))
  }),

  http.post(`${API}/employees`, async ({ request }) => {
    await delay(DELAY)
    const body = (await request.json()) as Record<string, unknown>
    const firstName = (body.firstName as string) ?? ''
    const lastName = (body.lastName as string) ?? ''
    return HttpResponse.json({
      id: `emp-new-${Date.now()}`,
      isActive: true,
      name: `${firstName} ${lastName}`.trim(),
      ...body,
    }, { status: 201 })
  }),

  http.patch(`${API}/employees/:id`, async ({ params, request }) => {
    await delay(DELAY)
    const body = (await request.json()) as Record<string, unknown>
    const emp  = mockEmployees.find(e => e.id === params.id)
    return emp
      ? HttpResponse.json({ ...emp, ...body })
      : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),

  // ─── Clients ────────────────────────────────────────────────────────────────
  http.get(`${API}/clients`, async ({ request }) => {
    await delay(DELAY)
    const url    = new URL(request.url)
    const orgId  = url.searchParams.get('organizationId')
    const search = url.searchParams.get('search')?.toLowerCase()
    const page   = parseInt(url.searchParams.get('page')  ?? '1', 10)
    const limit  = parseInt(url.searchParams.get('limit') ?? '15', 10)

    let result = orgId ? mockClients.filter(c => c.organizationId === orgId) : mockClients
    if (search) result = result.filter(c =>
      c.name.toLowerCase().includes(search) || c.phone.includes(search)
    )

    const total = result.length
    const start = (page - 1) * limit
    const data  = result.slice(start, start + limit)

    return HttpResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  }),

  http.get(`${API}/clients/:id`, async ({ params }) => {
    await delay(DELAY)
    const client = mockClients.find(c => c.id === params.id)
    return client ? HttpResponse.json(client) : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),

  http.post(`${API}/clients`, async ({ request }) => {
    await delay(DELAY)
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: `cli-new-${Date.now()}`, loyaltyPoints: 0, tags: [], ...body, createdAt: new Date().toISOString() }, { status: 201 })
  }),

  http.patch(`${API}/clients/:id`, async ({ params, request }) => {
    await delay(DELAY)
    const body   = (await request.json()) as Record<string, unknown>
    const client = mockClients.find(c => c.id === params.id)
    return client
      ? HttpResponse.json({ ...client, ...body })
      : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),

  http.delete(`${API}/clients/:id`, async ({ params }) => {
    await delay(DELAY)
    const idx = mockClients.findIndex(c => c.id === params.id)
    if (idx !== -1) mockClients.splice(idx, 1)
    return HttpResponse.json({ success: true })
  }),

  // ─── Services ───────────────────────────────────────────────────────────────
  http.get(`${API}/services`, async ({ request }) => {
    await delay(DELAY)
    const orgId  = new URL(request.url).searchParams.get('organizationId')
    const result = orgId ? mockServices.filter(s => s.organizationId === orgId) : mockServices
    return HttpResponse.json(result)
  }),

  http.post(`${API}/services`, async ({ request }) => {
    await delay(DELAY)
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: `svc-new-${Date.now()}`, isActive: true, ...body }, { status: 201 })
  }),

  http.patch(`${API}/services/:id`, async ({ params, request }) => {
    await delay(DELAY)
    const body = (await request.json()) as Record<string, unknown>
    const svc  = mockServices.find(s => s.id === params.id)
    return svc
      ? HttpResponse.json({ ...svc, ...body })
      : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),

  http.delete(`${API}/services/:id`, async () => {
    await delay(DELAY)
    return HttpResponse.json({ success: true })
  }),

  // ─── Appointments ───────────────────────────────────────────────────────────
  http.get(`${API}/appointments`, async ({ request }) => {
    await delay(DELAY)
    const url            = new URL(request.url)
    const locationId     = url.searchParams.get('locationId')
    const employeeId     = url.searchParams.get('employeeId')
    const startsAt       = url.searchParams.get('startsAt')
    const endsAt         = url.searchParams.get('endsAt')
    const organizationId = url.searchParams.get('organizationId')

    // Resolve which locationIds belong to this org
    let result = [...mockAppointments]
    if (organizationId) {
      const orgLocationIds = new Set(
        mockLocations.filter(l => l.organizationId === organizationId).map(l => l.id)
      )
      result = result.filter(a => orgLocationIds.has(a.locationId))
    }
    if (locationId) result = result.filter(a => a.locationId === locationId)
    if (employeeId) result = result.filter(a => a.employeeId === employeeId)
    if (startsAt && endsAt) {
      result = result.filter(a => {
        const aptDate = a.startsAt.slice(0, 10)
        return aptDate >= startsAt && aptDate <= endsAt
      })
    }
    return HttpResponse.json(result)
  }),

  http.post(`${API}/appointments`, async ({ request }) => {
    await delay(DELAY)
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: `apt-new-${Date.now()}`, ...body, createdAt: new Date().toISOString() }, { status: 201 })
  }),

  http.patch(`${API}/appointments/:id`, async ({ params, request }) => {
    await delay(DELAY)
    const body = (await request.json()) as Record<string, unknown>
    const apt  = mockAppointments.find(a => a.id === params.id)
    return apt
      ? HttpResponse.json({ ...apt, ...body })
      : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),

  // ✅ Rota específica para mudar status (usada pelo useUpdateAppointmentStatus)
  http.patch(`${API}/appointments/:id/status`, async ({ params, request }) => {
    await delay(DELAY)
    const { status } = (await request.json()) as { status: string }
    const normalized = status?.toLowerCase()
    const valid = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']
    if (!valid.includes(normalized)) {
      return HttpResponse.json({ message: 'Status inválido' }, { status: 400 })
    }
    const apt = mockAppointments.find(a => a.id === params.id)
    if (!apt) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    }
    apt.status = normalized as Appointment['status']
    return HttpResponse.json({ ...apt })
  }),

  http.delete(`${API}/appointments/:id`, async () => {
    await delay(DELAY)
    return HttpResponse.json({ success: true })
  }),

  // ─── Analytics ──────────────────────────────────────────────────────────────
  http.get(`${API}/analytics/summary`, async ({ request }) => {
    await delay(DELAY)
    const locationId = new URL(request.url).searchParams.get('locationId') ?? 'all'
    const apts = locationId === 'all'
      ? mockAppointments
      : mockAppointments.filter(a => a.locationId === locationId)
    const todayApts  = apts.filter(a => a.startsAt.startsWith(new Date().toISOString().slice(0, 10)))
    const revenue    = todayApts.filter(a => a.status === 'completed').reduce((s, a) => s + (a.price || 0), 0)
    return HttpResponse.json({
      locationId,
      period:        'day',
      revenue,
      appointments:  todayApts.length,
      averageTicket: todayApts.length ? revenue / todayApts.filter(a => a.status === 'completed').length || 0 : 0,
      occupancyRate: 0.72,
      noShowRate:    todayApts.filter(a => a.status === 'no_show').length / (todayApts.length || 1),
      topService:    'Corte + Barba',
      topEmployee:   mockEmployees.find(e => e.locationId === locationId)?.name ?? 'N/A',
    })
  }),

  http.get(`${API}/analytics/revenue-trend`, async ({ request }) => {
    await delay(DELAY)
    const url = new URL(request.url)
    const locationId   = url.searchParams.get('locationId') ?? undefined
    const orgId        = url.searchParams.get('organizationId') ?? undefined
    const period       = url.searchParams.get('period') ?? 'day'
    const refDateStr   = url.searchParams.get('refDate')

    const now = refDateStr ? new Date(refDateStr + 'T12:00:00') : new Date()

    // Helper functions (same as backend)
    function formatDate(d: Date): string {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

    function formatMonth(d: Date): string {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      return `${yyyy}-${mm}`
    }

    function subDays(d: Date, n: number): Date {
      const r = new Date(d)
      r.setDate(r.getDate() - n)
      return r
    }

    function subWeeks(d: Date, n: number): Date {
      return subDays(d, n * 7)
    }

    function startOfMonth(d: Date): Date {
      const r = new Date(d)
      r.setDate(1)
      r.setHours(0, 0, 0, 0)
      return r
    }

    function endOfMonth(d: Date): Date {
      const r = new Date(d)
      r.setMonth(r.getMonth() + 1)
      r.setDate(0)
      r.setHours(23, 59, 59, 999)
      return r
    }

    function getMonday(date: Date): Date {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      const day = d.getDay()
      const diff = day === 0 ? -6 : 1 - day
      d.setDate(d.getDate() + diff)
      return d
    }

    const MONTH_NAMES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

    // Filter appointments for org
    let allApts = orgId
      ? mockAppointments.filter(a => {
          const loc = mockLocations.find(l => l.id === a.locationId)
          return loc?.organizationId === orgId
        })
      : [...mockAppointments]

    if (locationId && locationId !== 'all') {
      allApts = allApts.filter(a => a.locationId === locationId)
    }

    // Only completed appointments contribute to revenue trend
    const completedApts = allApts.filter(a => a.status === 'completed')

    const getPrice = (a: typeof completedApts[0]) => {
      if (a.price != null && a.price > 0) return a.price
      const svc = mockServices.find(s => s.id === a.serviceId)
      return svc?.basePrice ?? 0
    }

    interface TrendItem { date: string; revenue: number; appointments: number; label: string }
    const trendData: TrendItem[] = []

    const dateTo = new Date(now)
    dateTo.setHours(23, 59, 59, 999)

    switch (period) {
      case 'day': {
        const dateFrom = subDays(now, 13)
        dateFrom.setHours(0, 0, 0, 0)
        const revMap = new Map<string, number>()
        const aptMap = new Map<string, number>()
        for (const a of completedApts) {
          if (!a.startsAt) continue
          const dStr = a.startsAt.slice(0, 10)
          if (dStr >= formatDate(dateFrom) && dStr <= formatDate(dateTo)) {
            revMap.set(dStr, (revMap.get(dStr) || 0) + getPrice(a))
            aptMap.set(dStr, (aptMap.get(dStr) || 0) + 1)
          }
        }
        for (let i = 0; i < 14; i++) {
          const d = subDays(dateFrom, -i)
          const key = formatDate(d)
          trendData.push({ date: key, revenue: revMap.get(key) || 0, appointments: aptMap.get(key) || 0, label: '' })
        }
        break
      }
      case 'week': {
        const dateFrom = subWeeks(now, 13)
        dateFrom.setHours(0, 0, 0, 0)
        const startMonday = getMonday(dateFrom)
        for (let i = 0; i < 14; i++) {
          const monday = new Date(startMonday)
          monday.setDate(monday.getDate() + i * 7)
          const key = formatDate(monday)
          const wkStart = new Date(monday)
          const wkEnd = new Date(monday)
          wkEnd.setDate(wkEnd.getDate() + 7)
          const aptsInWeek = completedApts.filter(a => {
            if (!a.startsAt) return false
            const d = new Date(a.startsAt)
            return d >= wkStart && d < wkEnd
          })
          const rev = aptsInWeek.reduce((s, a) => s + getPrice(a), 0)
          const dayNum = monday.getDate()
          trendData.push({ date: key, revenue: rev, appointments: aptsInWeek.length, label: `${dayNum} ${MONTH_NAMES_PT[monday.getMonth()]}` })
        }
        break
      }
      case 'month': {
        const dateFrom = startOfMonth(now)
        const revMap = new Map<string, number>()
        const aptMap = new Map<string, number>()
        for (const a of completedApts) {
          if (!a.startsAt) continue
          const dStr = a.startsAt.slice(0, 10)
          if (dStr >= formatDate(dateFrom) && dStr <= formatDate(dateTo)) {
            revMap.set(dStr, (revMap.get(dStr) || 0) + getPrice(a))
            aptMap.set(dStr, (aptMap.get(dStr) || 0) + 1)
          }
        }
        const lastDay = endOfMonth(now).getDate()
        for (let day = 1; day <= lastDay; day++) {
          const d = new Date(now.getFullYear(), now.getMonth(), day)
          const key = formatDate(d)
          trendData.push({ date: key, revenue: revMap.get(key) || 0, appointments: aptMap.get(key) || 0, label: '' })
        }
        break
      }
      case 'year': {
        for (let month = 0; month < 12; month++) {
          const mStart = new Date(now.getFullYear(), month, 1)
          mStart.setHours(0, 0, 0, 0)
          const mEnd = new Date(now.getFullYear(), month + 1, 0, 23, 59, 59, 999)
          const aptsFiltered = completedApts.filter(a => {
            if (!a.startsAt) return false
            const d = new Date(a.startsAt)
            return d >= mStart && d <= mEnd
          })
          const rev = aptsFiltered.reduce((s, a) => s + getPrice(a), 0)
          trendData.push({ date: formatMonth(mStart), revenue: rev, appointments: aptsFiltered.length, label: MONTH_NAMES_PT[month] })
        }
        break
      }
    }

    const mode = period === 'year' ? 'monthly' : period === 'week' ? 'weekly' : 'daily'
    return HttpResponse.json({ data: trendData, mode })
  }),

  // ── Reports (mock) ──────────────────────────────────────────────────────────
  http.get(`${API}/analytics/reports`, async ({ request }) => {
    await delay(DELAY)
    const url = new URL(request.url)
    const locationId = url.searchParams.get('locationId') ?? undefined
    const employeeId = url.searchParams.get('employeeId') ?? undefined
    const startsAt   = url.searchParams.get('startsAt') ?? ''
    const endsAt     = url.searchParams.get('endsAt') ?? ''

    // Start with all appointments (org-scoping is done by JWT on real backend)
    let apts = [...mockAppointments]
    if (locationId && locationId !== 'all') apts = apts.filter(a => a.locationId === locationId)
    if (employeeId) apts = apts.filter(a => a.employeeId === employeeId)
    if (startsAt && endsAt) {
      apts = apts.filter(a => {
        const d = a.startsAt.slice(0, 10)
        return d >= startsAt && d <= endsAt
      })
    }

    const getPrice = (a: typeof apts[0]) => a.price && a.price > 0 ? a.price : (mockServices.find(s => s.id === a.serviceId)?.basePrice ?? 0)

    const completedApts = apts.filter(a => a.status === 'completed')
    const completedCount = completedApts.length
    const totalRevenue = completedApts.reduce((s, a) => s + getPrice(a), 0)

    const statusBreakdown = (['completed', 'confirmed', 'pending', 'cancelled', 'no_show', 'in_progress'] as const)
      .map(status => ({ status, count: apts.filter(a => a.status === status).length }))

    const empStats = Array.from(new Set(apts.map(a => a.employeeId)))
      .map(empId => {
        const emp = mockEmployees.find(e => e.id === empId)
        const ea = completedApts.filter(a => a.employeeId === empId)
        return { employee: { id: empId, name: emp?.name ?? empId }, count: ea.length, revenue: ea.reduce((s, a) => s + getPrice(a), 0), avgRating: 0 }
      })
      .sort((a, b) => b.revenue - a.revenue)

    const clientStats = Array.from(new Set(apts.map(a => a.clientId)))
      .map(cliId => {
        const cli = mockClients.find(c => c.id === cliId)
        const ca = completedApts.filter(a => a.clientId === cliId)
        return { client: { id: cliId, name: cli?.name ?? cliId, phone: cli?.phone ?? null }, count: ca.length, revenue: ca.reduce((s, a) => s + getPrice(a), 0) }
      })
      .filter(c => c.count > 0)

    const serviceStats = Array.from(new Set(apts.map(a => a.serviceId)))
      .map(svcId => {
        const svc = mockServices.find(s => s.id === svcId)
        const sa = completedApts.filter(a => a.serviceId === svcId)
        return { service: { id: svcId, name: svc?.name ?? svcId, color: svc?.color ?? '#6366f1' }, count: sa.length, revenue: sa.reduce((s, a) => s + getPrice(a), 0) }
      })
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count)

    const locRev: Record<string, { name: string; revenue: number }> = {}
    completedApts.forEach(a => {
      const loc = mockLocations.find(l => l.id === a.locationId)
      const name = loc?.name ?? a.locationId
      if (!locRev[a.locationId]) locRev[a.locationId] = { name, revenue: 0 }
      locRev[a.locationId].revenue += getPrice(a)
    })

    return HttpResponse.json({
      total: apts.length,
      completedCount,
      totalRevenue,
      statusBreakdown,
      employeeStats: empStats,
      clientStats,
      serviceStats,
      locationRevenue: locRev,
    })
  }),

  // ── Financial Summary (mock) ───────────────────────────────────────────────
  http.get(`${API}/analytics/financial-summary`, async ({ request }) => {
    await delay(DELAY)
    const url = new URL(request.url)
    const locationId   = url.searchParams.get('locationId') ?? undefined
    const orgId        = url.searchParams.get('organizationId') ?? undefined
    const period       = url.searchParams.get('period') ?? 'month'
    const refDateStr   = url.searchParams.get('refDate')

    // Calculate date range based on period
    const now = refDateStr ? new Date(refDateStr + 'T12:00:00') : new Date()
    let dateFrom = new Date(now)
    const dateTo = new Date(now)
    dateTo.setHours(23, 59, 59, 999)

    switch (period) {
      case 'day':
        // Current day only (00:00:00 to 23:59:59)
        dateFrom.setHours(0, 0, 0, 0)
        dateTo.setHours(23, 59, 59, 999)
        break
      case 'week':
        // Current week only (Monday to Sunday)
        dateFrom.setDate(dateFrom.getDate() - dateFrom.getDay() + 1)
        dateFrom.setHours(0, 0, 0, 0)
        dateTo.setDate(dateFrom.getDate() + 6)
        dateTo.setHours(23, 59, 59, 999)
        break
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1)
        break
    }

    // Filter appointments for the current org (and optionally location)
    let allApts = orgId
      ? mockAppointments.filter(a => {
          const loc = mockLocations.find(l => l.id === a.locationId)
          return loc?.organizationId === orgId
        })
      : [...mockAppointments]

    if (locationId && locationId !== 'all') {
      allApts = allApts.filter(a => a.locationId === locationId)
    }

    // Filter by date range
    const apts = allApts.filter(a => {
      try {
        const aptDate = new Date(a.startsAt)
        return aptDate >= dateFrom && aptDate <= dateTo
      } catch {
        return false
      }
    })

    const total = apts.length
    const completedApts = apts.filter(a => a.status === 'completed')
    const completedCount = completedApts.length
    const confirmedCount = apts.filter(a => a.status === 'confirmed').length
    const pendingCount = apts.filter(a => a.status === 'pending').length
    const noShowCount = apts.filter(a => a.status === 'no_show').length
    const cancelledCount = apts.filter(a => a.status === 'cancelled').length

    const getPrice = (a: typeof apts[0]) => {
      if (a.price != null && a.price > 0) return a.price
      const svc = mockServices.find(s => s.id === a.serviceId)
      return svc?.basePrice ?? 0
    }

    const totalRevenue = completedApts.reduce((s, a) => s + getPrice(a), 0)
    const avgTicket = completedCount > 0 ? totalRevenue / completedCount : 0
    const noShowRate = total > 0 ? noShowCount / total : 0

    const revenueByStatus = {
      completed: totalRevenue,
      confirmed: apts.filter(a => a.status === 'confirmed').reduce((s, a) => s + getPrice(a), 0),
      pending: apts.filter(a => a.status === 'pending').reduce((s, a) => s + getPrice(a), 0),
    }

    const projectedRevenue = revenueByStatus.completed + revenueByStatus.confirmed + revenueByStatus.pending

    // Top services
    const svcRevMap: Record<string, { name: string; revenue: number }> = {}
    for (const a of completedApts) {
      const svc = mockServices.find(s => s.id === a.serviceId)
      const name = svc?.name ?? a.serviceId
      if (!svcRevMap[name]) svcRevMap[name] = { name, revenue: 0 }
      svcRevMap[name].revenue += getPrice(a)
    }
    const topServices = Object.values(svcRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    // Revenue by location
    const locationRev: Record<string, number> = {}
    for (const a of completedApts) {
      locationRev[a.locationId] = (locationRev[a.locationId] ?? 0) + getPrice(a)
    }

    return HttpResponse.json({
      period: url.searchParams.get('period') ?? 'month',
      total,
      completedCount,
      confirmedCount,
      pendingCount,
      cancelledCount,
      noShowCount,
      totalRevenue,
      avgTicket,
      noShowRate,
      revenueByStatus,
      projectedRevenue,
      topServices,
      locationRevenue: locationRev,
    })
  }),



  // ─── Location Settings ────────────────────────────────────────────────────────

  http.get(`${API}/locations/:id/settings`, async ({ params }) => {
    await delay(DELAY)
    const settings = mockLocationSettings.find(s => s.locationId === params.id)
    // @ts-ignore - Erro de tipo conhecido no mock, não afeta funcionalidade
    return HttpResponse.json(settings ?? {
      locationId: params.id,
      horizonMode: 'rolling',
      rollingValue: 30,
      rollingUnit: 'days',
      monthlyOpenDay: 25,
      fixedOpenUntil: '',
      minAdvanceHours: 1,
      slotIntervalMins: 30,
    })
  }),

  http.put(`${API}/locations/:id/settings`, async ({ params, request }) => {
    await delay(DELAY)
    const body = (await request.json()) as Partial<typeof mockLocationSettings[0]>
    const idx = mockLocationSettings.findIndex(s => s.locationId === params.id)
    if (idx >= 0) Object.assign(mockLocationSettings[idx], body)
    else mockLocationSettings.push({
      locationId: params.id as string,
      horizonMode: 'rolling',
      rollingValue: 30,
      rollingUnit: 'days',
      monthlyOpenDay: 25,
      fixedOpenUntil: '',
      minAdvanceHours: 1,
      slotIntervalMins: 30,
      ...body
    })
    return HttpResponse.json({ ok: true })
  }),

  // ─── Employee Absences ────────────────────────────────────────────────────────

  http.get(`${API}/locations/:id/employee-absences`, async ({ params }) => {
    await delay(DELAY)
    return HttpResponse.json(mockEmployeeAbsences.filter(a => a.locationId === params.id))
  }),

  http.post(`${API}/locations/:id/employee-absences`, async ({ params, request }) => {
    await delay(DELAY)
    const body = (await request.json()) as { employeeId: string; startDate: string; endDate: string; reason: string }
    const absence = { id: `abs-${Date.now()}`, locationId: params.id as string, ...body }
    mockEmployeeAbsences.push(absence)
    return HttpResponse.json(absence, { status: 201 })
  }),

  http.delete(`${API}/locations/:id/employee-absences/:absenceId`, async ({ params }) => {
    await delay(DELAY)
    const idx = mockEmployeeAbsences.findIndex(a => a.id === params.absenceId)
    if (idx >= 0) mockEmployeeAbsences.splice(idx, 1)
    return HttpResponse.json({ ok: true })
  }),

  // ─── Location Schedule ────────────────────────────────────────────────────────

  http.get(`${API}/locations/:id/schedule`, async ({ params }) => {
    await delay(DELAY)
    const schedule = mockLocationSchedules.filter(s => s.locationId === params.id)
    return HttpResponse.json(schedule)
  }),

  http.put(`${API}/locations/:id/schedule`, async ({ params, request }) => {
    await delay(DELAY)
    const updates = (await request.json()) as Array<{ dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }>
    updates.forEach(u => {
      const idx = mockLocationSchedules.findIndex(s => s.locationId === params.id && s.dayOfWeek === u.dayOfWeek)
      if (idx >= 0) Object.assign(mockLocationSchedules[idx], u)
      else mockLocationSchedules.push({ locationId: params.id as string, ...u } as any)
    })
    return HttpResponse.json({ ok: true })
  }),

  // ─── Location Closures ────────────────────────────────────────────────────────

  http.get(`${API}/locations/:id/closures`, async ({ params }) => {
    await delay(DELAY)
    return HttpResponse.json(mockLocationClosures.filter(c => c.locationId === params.id))
  }),

  http.post(`${API}/locations/:id/closures`, async ({ params, request }) => {
    await delay(DELAY)
    const body = (await request.json()) as { startDate: string; endDate: string; reason: string; type: string }
    const closure = {
      id: `cls-${Date.now()}`,
      locationId: params.id as string,
      ...body,
    }
    mockLocationClosures.push(closure as any)
    return HttpResponse.json(closure, { status: 201 })
  }),

  http.delete(`${API}/locations/:id/closures/:closureId`, async ({ params }) => {
    await delay(DELAY)
    const idx = mockLocationClosures.findIndex(c => c.id === params.closureId)
    if (idx >= 0) mockLocationClosures.splice(idx, 1)
    return HttpResponse.json({ ok: true })
  }),

  // ─── Public Booking API (no auth required) ───────────────────────────────────

  // GET /api/public/organizations — list all orgs with their locations
  http.get(`${API}/public/organizations`, async () => {
    await delay(DELAY)
    const result = mockOrganizations.map(org => ({
      id:        org.id,
      name:      org.name,
      slug:      org.slug,
      plan:      org.plan,
      locations: mockLocations
        .filter(l => l.organizationId === org.id && l.isActive)
        .map(l => ({ id: l.id, name: l.name, address: l.address, city: l.city })),
    }))
    return HttpResponse.json(result)
  }),

  // GET /api/public/services?orgId= — public service list for an org
  http.get(`${API}/public/services`, async ({ request }) => {
    await delay(DELAY)
    const orgId    = new URL(request.url).searchParams.get('orgId')
    const services = orgId
      ? mockServices.filter(s => s.organizationId === orgId && s.isActive)
      : []
    return HttpResponse.json(services.map(s => ({
      id: s.id, name: s.name, durationMinutes: s.durationMinutes,
      basePrice: s.basePrice, category: s.category, color: s.color,
    })))
  }),

  // GET /api/public/employees?locationId=&serviceId= — employees for a location
  // filtered to those whose serviceIds include the chosen service
  http.get(`${API}/public/employees`, async ({ request }) => {
    await delay(DELAY)
    const url        = new URL(request.url)
    const locationId = url.searchParams.get('locationId') ?? ''
    const serviceId  = url.searchParams.get('serviceId')  ?? ''

    let employees = mockEmployees.filter(e => e.locationId === locationId && e.isActive)

    // Filter to employees who perform this service (via serviceIds association).
    // If only 1 employee exists, they do all services — skip filtering.
    if (serviceId && employees.length > 1) {
      const filtered = employees.filter(e => (e.serviceIds ?? []).includes(serviceId))
      if (filtered.length > 0) employees = filtered
    }

    return HttpResponse.json(employees.map(e => ({
      id: e.id, name: e.name, serviceIds: e.serviceIds ?? [], avatar: e.avatar ?? null,
    })))
  }),

  // GET /api/public/slots?locationId=&serviceId=&date=&employeeId=
  // Returns available time slots for a given day
  http.get(`${API}/public/slots`, async ({ request }) => {
    await delay(DELAY)
    const url        = new URL(request.url)
    const locationId = url.searchParams.get('locationId') ?? ''
    const serviceId  = url.searchParams.get('serviceId')  ?? ''
    const dateStr    = url.searchParams.get('date')       ?? ''
    const empFilter  = url.searchParams.get('employeeId') ?? ''

    const service   = mockServices.find(s => s.id === serviceId)
    if (!service) return HttpResponse.json([])

    // Check booking horizon based on mode
    const settings = mockLocationSettings.find(s => s.locationId === locationId)
    //const minAdvanceHours = settings?.minAdvanceHours ?? 1
    const todayDate = new Date(); todayDate.setHours(0,0,0,0)
    const slotDate  = new Date(dateStr + 'T00:00:00')
    const mode = settings?.horizonMode ?? 'rolling'

    let maxDate = new Date(todayDate)
    if (mode === 'rolling') {
      const val  = settings?.rollingValue ?? 30
      const unit = settings?.rollingUnit  ?? 'days'
      if      (unit === 'days')   maxDate.setDate(maxDate.getDate()     + val)
      else if (unit === 'weeks')  maxDate.setDate(maxDate.getDate()     + val * 7)
      else if (unit === 'months') maxDate.setMonth(maxDate.getMonth()   + val)
    } else if (mode === 'monthly') {
      // Opens on day N of current month for the following month
      const openDay = settings?.monthlyOpenDay ?? 25
      const now = new Date()
      const isOpen = now.getDate() >= openDay
      if (isOpen) {
        // Can book into next month
        maxDate = new Date(now.getFullYear(), now.getMonth() + 2, 0) // end of next month
      } else {
        // Not yet open — only current month visible
        maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 0) // end of current month
      }
    } else if (mode === 'fixed') {
      const fixedDate = settings?.fixedOpenUntil
      if (fixedDate) maxDate = new Date(fixedDate + 'T23:59:59')
    }

    if (slotDate > maxDate) return HttpResponse.json([])

    // Check if location is closed on this date (closure or schedule)
    const dateObj = new Date(dateStr + 'T12:00:00')
    const dayOfWeek = dateObj.getDay()
    const locSchedule = mockLocationSchedules.find(s => s.locationId === locationId && s.dayOfWeek === dayOfWeek)
    if (locSchedule && !locSchedule.isOpen) return HttpResponse.json([])

    const isClosed = mockLocationClosures.some(c =>
      c.locationId === locationId && dateStr >= c.startDate && dateStr <= c.endDate
    )
    if (isClosed) return HttpResponse.json([])

    const duration  = service.durationMinutes
    const employees = mockEmployees.filter(e =>
      e.locationId === locationId && e.isActive &&
      (!empFilter || e.id === empFilter)
    )

    // Get all existing appointments for this day at this location
    const dayApts = mockAppointments.filter(a =>
      a.locationId === locationId && a.startsAt.startsWith(dateStr) &&
      !['cancelled', 'no_show'].includes(a.status)
    )

    // Generate slots: 09:00 – 19:00 in 30-min increments
    const slots: { time: string; startsAt: string; employeeId: string; employeeName: string }[] = []
    const [year, month, day] = dateStr.split('-').map(Number)

    for (const emp of employees) {
      const hours = mockWorkingHours.find(h =>
        h.employeeId === emp.id &&
        h.dayOfWeek === new Date(year, month - 1, day).getDay()
      )
      if (!hours || !hours.isWorking) continue

      const [startH] = hours.startTime.split(':').map(Number)
      const [endH, endM]   = hours.endTime.split(':').map(Number)
      const workEnd = endH * 60 + endM

      // Skip if employee is absent on this date
      const isAbsent = mockEmployeeAbsences.some(a =>
        a.employeeId === emp.id && dateStr >= a.startDate && dateStr <= a.endDate
      )
      if (isAbsent) continue

      // Busy intervals for this employee today
      const busy = dayApts
        .filter(a => a.employeeId === emp.id)
        .map(a => {
          const s = new Date(a.startsAt)
          const e = new Date(a.endsAt)
          return { start: s.getHours() * 60 + s.getMinutes(), end: e.getHours() * 60 + e.getMinutes() }
        })

      let current = startH * 60
      while (current + duration <= workEnd) {
        const end      = current + duration
        const isBusy   = busy.some(b => current < b.end && end > b.start)
        const isPast   = (() => {
          const slotDate = new Date(year, month - 1, day, Math.floor(current / 60), current % 60)
          return slotDate <= new Date()
        })()

        if (!isBusy && !isPast) {
          const hh = String(Math.floor(current / 60)).padStart(2, '0')
          const mm = String(current % 60).padStart(2, '0')
          const startsAt = new Date(year, month - 1, day, Math.floor(current / 60), current % 60).toISOString()
          slots.push({ time: `${hh}:${mm}`, startsAt, employeeId: emp.id, employeeName: emp.name })
        }
        current += 30
      }
    }

    // Sort by time, deduplicate time+employee
    slots.sort((a, b) => a.time.localeCompare(b.time))
    return HttpResponse.json(slots)
  }),

  // POST /api/public/book — create appointment as guest or existing client
  http.post(`${API}/public/book`, async ({ request }) => {
    await delay(DELAY + 200)
    const body = (await request.json()) as {
      organizationId: string; locationId: string; serviceId: string
      employeeId: string; startsAt: string
      clientName: string; clientPhone: string; notes?: string
    }

    const service = mockServices.find(s => s.id === body.serviceId)
    if (!service) return HttpResponse.json({ message: 'Serviço não encontrado' }, { status: 404 })

    // Find or create client by phone
    let client = mockClients.find(c =>
      c.phone.replace(/\s/g, '') === body.clientPhone.replace(/\s/g, '') &&
      c.organizationId === body.organizationId
    )
    if (!client) {
      client = {
        id:             `cli-guest-${Date.now()}`,
        organizationId: body.organizationId,
        name:           body.clientName,
        phone:          body.clientPhone,
        tags:           ['new'],
        loyaltyPoints:  0,
        createdAt:      new Date().toISOString(),
        isGuest:        true,
      } as any
      mockClients.push(client as any)
    }

    // Calculate endsAt
    const starts  = new Date(body.startsAt)
    const ends    = new Date(starts.getTime() + service.durationMinutes * 60000)

    const apt = {
      id:         `apt-guest-${Date.now()}`,
      locationId:  body.locationId,
      employeeId:  body.employeeId,
      clientId:    client!.id,
      serviceId:   body.serviceId,
      status:      'confirmed' as const,
      startsAt:    body.startsAt,
      endsAt:      ends.toISOString(),
      price:       service.basePrice,
      notes:       body.notes ?? '',
      createdAt:   new Date().toISOString(),
    }
    mockAppointments.push(apt)

    return HttpResponse.json({ appointmentId: apt.id }, { status: 201 })
  }),

  // GET /api/public/booking/:id — retrieve confirmed booking details
  http.get(`${API}/public/booking/:id`, async ({ params }) => {
    await delay(DELAY)
    const apt = mockAppointments.find(a => a.id === params.id)
    if (!apt) return HttpResponse.json({ message: 'Não encontrado' }, { status: 404 })

    const client   = mockClients.find(c => c.id === apt.clientId)
    const service  = mockServices.find(s => s.id === apt.serviceId)
    const employee = mockEmployees.find(e => e.id === apt.employeeId)
    const location = mockLocations.find(l => l.id === apt.locationId)

    return HttpResponse.json({
      id:              apt.id,
      clientName:      client?.name  ?? 'Cliente',
      serviceName:     service?.name ?? apt.serviceId,
      serviceColor:    service?.color ?? '#6366f1',
      durationMinutes: service?.durationMinutes ?? 30,
      employeeName:    employee?.name ?? apt.employeeId,
      locationName:    location?.name ?? apt.locationId,
      startsAt:        apt.startsAt,
      price:           apt.price,
    })
  }),
]
