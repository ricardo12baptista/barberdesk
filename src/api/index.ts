import { apiClient } from './client'
import type {
  Appointment,
  AppointmentStatus,
  Client,
  Employee,
  Location,
  LocationClosure,
  LocationSchedule,
  LocationSettings,
  Organization,
  Service,
  User,
} from '@/models'

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
  getAll:  () =>
    apiClient.get<Location[]>('/locations'),
  getById: (id: string) => apiClient.get<Location>(`/locations/${id}`),
  create:  (data: Partial<Location>) => apiClient.post<Location>('/locations', data),
  update:  (id: string, data: Partial<Location>) => apiClient.put<Location>(`/locations/${id}`, data),
  delete:  (id: string) => apiClient.delete(`/locations/${id}`),
}

export interface EmployeeAbsence {
  id: string
  employeeId: string
  locationId: string
  startDate: string
  endDate: string
  reason: string
}

export const locationScheduleApi = {
  getSchedule: (locationId: string) =>
    apiClient.get<LocationSchedule[]>(`/locations/${locationId}/schedule`),
  updateSchedule: (locationId: string, schedule: LocationSchedule[]) =>
    apiClient.put(`/locations/${locationId}/schedule`, schedule),
  getSettings: (locationId: string) =>
    apiClient.get<LocationSettings>(`/locations/${locationId}/settings`),
  updateSettings: (locationId: string, settings: Partial<LocationSettings>) =>
    apiClient.put(`/locations/${locationId}/settings`, settings),
  getClosures: (locationId: string) =>
    apiClient.get<LocationClosure[]>(`/locations/${locationId}/closures`),
  createClosure: (locationId: string, data: Omit<LocationClosure, 'id' | 'locationId'>) =>
    apiClient.post<LocationClosure>(`/locations/${locationId}/closures`, data),
  deleteClosure: (locationId: string, closureId: string) =>
    apiClient.delete(`/locations/${locationId}/closures/${closureId}`),
  getAbsences: (locationId: string) =>
    apiClient.get<EmployeeAbsence[]>(`/locations/${locationId}/employee-absences`),
  createAbsence: (locationId: string, data: Omit<EmployeeAbsence, 'id' | 'locationId'>) =>
    apiClient.post<EmployeeAbsence>(`/locations/${locationId}/employee-absences`, data),
  deleteAbsence: (locationId: string, absenceId: string) =>
    apiClient.delete(`/locations/${locationId}/employee-absences/${absenceId}`),
}

// ─── Employees ────────────────────────────────────────────────────────────────
export interface CreateEmployeeData extends Partial<Employee> {
  firstName: string
  lastName: string
  email: string
  password?: string
  phone?: string
}

export const employeesApi = {
  getAll:          (locationId?: string) =>
    apiClient.get<Employee[]>('/employees', { params: { locationId } }),
  getById:         (id: string) => apiClient.get<Employee>(`/employees/${id}`),
  create:          (data: CreateEmployeeData) => apiClient.post<Employee>('/employees', data),
  update:          (id: string, data: Partial<Employee>) => apiClient.put<Employee>(`/employees/${id}`, data),
  getWorkingHours: (id: string) => apiClient.get(`/employees/${id}/working-hours`),
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clientsApi = {
  getAll:  (_organizationId?: string, search?: string, page = 1, limit = 15) =>
    apiClient.get<{ data: Client[]; total: number; page: number; limit: number; totalPages: number } | Client[]>(
      '/clients', { params: { search, page, limit } }
    ),
  getById: (id: string) => apiClient.get<Client>(`/clients/${id}`),
  create:  (data: Partial<Client>) => apiClient.post<Client>('/clients', data),
  update:  (id: string, data: Partial<Client>) => apiClient.put<Client>(`/clients/${id}`, data),
  delete:  (id: string) => apiClient.delete(`/clients/${id}`),
}

// ─── Services ─────────────────────────────────────────────────────────────────
export const servicesApi = {
  getAll:  (locationId?: string) =>
    apiClient.get<Service[]>('/services', { params: { locationId } }),
  getById: (id: string) => apiClient.get<Service>(`/services/${id}`),
  create:  (data: Partial<Service>) => apiClient.post<Service>('/services', data),
  update:  (id: string, data: Partial<Service>) => apiClient.put<Service>(`/services/${id}`, data),
  delete:  (id: string) => apiClient.delete(`/services/${id}`),
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export interface AppointmentFilters {
  locationId?:  string
  employeeId?:  string
  date?:        string
  startsAt?:   string
  endsAt?:     string
  status?:      AppointmentStatus
}

export const appointmentsApi = {
  getAll:       (filters?: AppointmentFilters) =>
    apiClient.get<Appointment[]>('/appointments', { params: filters }),
  getAvailableSlots: (employeeId: string, date: string, slotDurationMinutes?: number) =>
    apiClient.get(`/appointments/available-slots`, { params: { employeeId, date, slotDurationMinutes } }),
  create:       (data: Partial<Appointment>) => apiClient.post<Appointment>('/appointments', data),
  update:       (id: string, data: Partial<Appointment>) =>
    apiClient.put<Appointment>(`/appointments/${id}`, data),
  updateStatus: (id: string, status: AppointmentStatus) =>
    apiClient.patch<Appointment>(`/appointments/${id}/status`, { status }),
  delete:       (id: string) => apiClient.delete(`/appointments/${id}`),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getSummary:      (locationId?: string) =>
    apiClient.get('/analytics/summary', { params: { locationId } }),
  getRevenueTrend: (locationId?: string) =>
    apiClient.get('/analytics/revenue-trend', { params: { locationId } }),
}

// ─── Commission ────────────────────────────────────────────────────────────────
export const commissionApi = {
  getConfig:        (locationId?: string) =>
    apiClient.get('/commission-config', { params: { locationId } }),
  create:           (data: any) =>
    apiClient.post('/commission-config', data),
  update:           (id: string, data: any) =>
    apiClient.put(`/commission-config/${id}`, data),
  delete:           (id: string) =>
    apiClient.delete(`/commission-config/${id}`),
  calculateCommission: (employeeId: string, appointmentPrice: number, locationId: string) =>
    apiClient.post('/commission-config/calculate', { employeeId, appointmentPrice, locationId }),
}
