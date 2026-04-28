import { apiClient } from './client'
import type { Appointment, AppointmentStatus, Client, Employee, Location, Organization, Service, User } from '@/models'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:  (email: string, password: string) =>
    apiClient.post<{ user: User; organization: Organization; token: string }>(
      '/auth/login', { email, password }
    ),
  logout: () => apiClient.post('/auth/logout'),
}

// ─── Locations ────────────────────────────────────────────────────────────────
export const locationsApi = {
  getAll:  (organizationId?: string) =>
    apiClient.get<Location[]>('/locations', { params: { organizationId } }),
  getById: (id: string) => apiClient.get<Location>(`/locations/${id}`),
  create:  (data: Partial<Location>) => apiClient.post<Location>('/locations', data),
  update:  (id: string, data: Partial<Location>) => apiClient.put<Location>(`/locations/${id}`, data),
  delete:  (id: string) => apiClient.delete(`/locations/${id}`),
}

// ─── Employees ────────────────────────────────────────────────────────────────
export const employeesApi = {
  getAll:          (locationId?: string) =>
    apiClient.get<Employee[]>('/employees', { params: { locationId } }),
  getById:         (id: string) => apiClient.get<Employee>(`/employees/${id}`),
  create:          (data: Partial<Employee>) => apiClient.post<Employee>('/employees', data),
  update:          (id: string, data: Partial<Employee>) => apiClient.put<Employee>(`/employees/${id}`, data),
  getWorkingHours: (id: string) => apiClient.get(`/employees/${id}/working-hours`),
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clientsApi = {
  getAll:  (organizationId?: string, search?: string, page = 1, limit = 15) =>
    apiClient.get<{ data: Client[]; total: number; page: number; limit: number; totalPages: number } | Client[]>(
      '/clients', { params: { organizationId, search, page, limit } }
    ),
  getById: (id: string) => apiClient.get<Client>(`/clients/${id}`),
  create:  (data: Partial<Client>) => apiClient.post<Client>('/clients', data),
  update:  (id: string, data: Partial<Client>) => apiClient.put<Client>(`/clients/${id}`, data),
  delete:  (id: string) => apiClient.delete(`/clients/${id}`),
}

// ─── Services ─────────────────────────────────────────────────────────────────
export const servicesApi = {
  getAll:  (organizationId?: string) =>
    apiClient.get<Service[]>('/services', { params: { organizationId } }),
  create:  (data: Partial<Service>) => apiClient.post<Service>('/services', data),
  update:  (id: string, data: Partial<Service>) => apiClient.put<Service>(`/services/${id}`, data),
  delete:  (id: string) => apiClient.delete(`/services/${id}`),
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export interface AppointmentFilters {
  locationId?:  string
  employeeId?:  string
  //date?:        string
  startsAt?:   string
  endsAt?:     string
  status?:      AppointmentStatus
}

export const appointmentsApi = {
  getAll:  (filters?: AppointmentFilters) =>
    apiClient.get<Appointment[]>('/appointments', { params: filters }),
  create:  (data: Partial<Appointment>) => apiClient.post<Appointment>('/appointments', data),
  update:  (id: string, data: Partial<Appointment>) =>
    apiClient.put<Appointment>(`/appointments/${id}`, data),
  delete:  (id: string) => apiClient.delete(`/appointments/${id}`),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getSummary:      (locationId?: string) =>
    apiClient.get('/analytics/summary', { params: { locationId } }),
  getRevenueTrend: (locationId?: string) =>
    apiClient.get('/analytics/revenue-trend', { params: { locationId } }),
}
