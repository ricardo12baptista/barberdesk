import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  appointmentsApi,
  analyticsApi,
  clientsApi,
  employeesApi,
  locationsApi,
  servicesApi,
  AppointmentFilters,
} from '@/api'
import { useAuthStore } from '@/stores/auth.store'
import type { Appointment, Client, Employee, Location, Service } from '@/models'

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const qk = {
  locations:    (orgId?: string) => ['locations', orgId] as const,
  location:     (id: string) => ['locations', id] as const,
  employees:    (locationId?: string) => ['employees', locationId] as const,
  clients:      (orgId?: string, search?: string) => ['clients', orgId, search] as const,
  client:       (id: string) => ['clients', id] as const,
  services:     (orgId?: string) => ['services', orgId] as const,
  appointments: (filters?: AppointmentFilters) => ['appointments', filters] as const,
  summary:      (locationId?: string) => ['analytics', 'summary', locationId] as const,
  revenueTrend: (locationId?: string) => ['analytics', 'revenue-trend', locationId] as const,
}

// ─── Locations ────────────────────────────────────────────────────────────────
// Automatically scoped to the logged-in user's organization
export const useLocations = () => {
  const { organization } = useAuthStore()
  const orgId = organization?.id
  return useQuery({
    queryKey: qk.locations(orgId),
    queryFn:  () => locationsApi.getAll(orgId).then(r => r.data),
    enabled:  !!orgId,
  })
}

export const useLocation = (id: string) =>
  useQuery({ queryKey: qk.location(id), queryFn: () => locationsApi.getById(id).then(r => r.data) })

// ─── Employees ────────────────────────────────────────────────────────────────
export const useEmployees = (locationId?: string) =>
  useQuery({
    queryKey: qk.employees(locationId),
    queryFn:  () => employeesApi.getAll(locationId).then(r => r.data),
    enabled:  !!locationId,
  })

// ─── Clients ──────────────────────────────────────────────────────────────────
// Automatically scoped to org
export const useClients = (search?: string, page = 1, limit = 15) => {
  const { organization } = useAuthStore()
  const orgId = organization?.id
  return useQuery({
    queryKey: [...qk.clients(orgId, search), page, limit],
    queryFn:  () => clientsApi.getAll(orgId, search, page, limit).then(r => r.data),
    enabled:  !!orgId,
    placeholderData: (prev) => prev,  // keep previous page visible while loading next
  })
}

export const useClient = (id: string) =>
  useQuery({ queryKey: qk.client(id), queryFn: () => clientsApi.getById(id).then(r => r.data) })

export const useCreateClient = () => {
  const qc = useQueryClient()
  const { organization } = useAuthStore()
  return useMutation({
    mutationFn: (data: Partial<Client>) =>
      clientsApi.create({ ...data, organizationId: organization?.id }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

// ─── Services ─────────────────────────────────────────────────────────────────
// Automatically scoped to org
export const useServices = () => {
  const { organization } = useAuthStore()
  const orgId = organization?.id
  return useQuery({
    queryKey: qk.services(orgId),
    queryFn:  () => servicesApi.getAll(orgId).then(r => r.data),
    enabled:  !!orgId,
  })
}

export const useCreateService = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Service>) => servicesApi.create(data).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

export const useUpdateService = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      servicesApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export const useAppointments = (filters?: AppointmentFilters) => {
  const { organization } = useAuthStore()
  // Always scope appointments to the current org to prevent cross-org data leaks
  const scopedFilters = { ...filters, organizationId: organization?.id }
  return useQuery({
    queryKey: qk.appointments(scopedFilters),
    queryFn:  () => appointmentsApi.getAll(scopedFilters).then(r => r.data),
    staleTime: 1000 * 60 * 2,
    enabled:  !!organization?.id,
  })
}

export const useCreateAppointment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Appointment>) => appointmentsApi.create(data).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export const useUpdateAppointment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      appointmentsApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export const useDeleteAppointment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const useAnalyticsSummary = (locationId?: string) =>
  useQuery({
    queryKey: qk.summary(locationId),
    queryFn:  () => analyticsApi.getSummary(locationId).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })

export const useRevenueTrend = (locationId?: string) =>
  useQuery({
    queryKey: qk.revenueTrend(locationId),
    queryFn:  () => analyticsApi.getRevenueTrend(locationId).then(r => r.data),
  })

// ─── Location / Employee mutations ────────────────────────────────────────────
export const useCreateLocation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Location>) => locationsApi.create(data).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['locations'] }),
  })
}

export const useCreateEmployee = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Employee>) => employeesApi.create(data).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export { useIsMobile } from './useIsMobile'

export const useDeleteService = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

// Fetch ALL services across all orgs — used by super_admin for name resolution
export const useAllServices = () =>
  useQuery({
    queryKey: ['services', 'all'],
    queryFn:  () => servicesApi.getAll(undefined).then(r => r.data),
  })

// Fetch ALL locations across all orgs — used by super_admin for name resolution
export const useAllLocations = () =>
  useQuery({
    queryKey: ['locations', 'all'],
    queryFn:  () => locationsApi.getAll(undefined).then(r => r.data),
  })

// Fetch ALL clients without pagination — used for name resolution in appointments etc.
// Passes limit=9999 so the paginated handler returns everything in one page
export const useAllClients = () =>
  useQuery<Client[]>({
    queryKey: ['clients', 'all'],
    queryFn:  () => clientsApi.getAll(undefined, undefined, 1, 9999).then(r => {
      const data = r.data
      return (Array.isArray(data) ? data : (data as any).data ?? []) as Client[]
    }),
  })

// Same but scoped to the current org — for non-super_admin name resolution
export const useClientsFlat = () => {
  const { organization } = useAuthStore()
  const orgId = organization?.id
  return useQuery<Client[]>({
    queryKey: ['clients', 'flat', orgId],
    queryFn:  () => clientsApi.getAll(orgId, undefined, 1, 9999).then(r => {
      const data = r.data
      return (Array.isArray(data) ? data : (data as any).data ?? []) as Client[]
    }),
    enabled: !!orgId,
  })
}

export const useUpdateClient = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) =>
      clientsApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export const useDeleteClient = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}
