// ─── Roles ────────────────────────────────────────────────────────────────────
export type Role = 'super_admin' | 'owner' | 'manager' | 'partner' | 'employee'

// ─── Organisation & Location ──────────────────────────────────────────────────
export interface Organization {
  id: string
  name: string
  slug: string
  logo?: string
  plan: 'basic' | 'pro' | 'premium' | 'enterprise'
  isActive: boolean
  createdAt: string
}

export interface Location {
  id: string
  organizationId: string
  name: string
  address: string
  city: string
  phone: string
  email: string
  timezone: string
  isActive: boolean
  createdAt: string
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  organizationId: string
  locationId: string | null   // null = super_admin (access to all locations)
  name: string
  email: string
  phone?: string
  avatar?: string
  role: Role
  isActive: boolean
  createdAt: string
}

// ─── Service ──────────────────────────────────────────────────────────────────
export interface Service {
  id: string
  organizationId: string
  name: string
  description?: string
  durationMinutes: number
  basePrice: number
  category: string
  isActive: boolean
  color: string
  // New many-to-many fields
  locationActive?: boolean       // whether service is active for the requested location
  locationPrice?: number | null  // per-location price override
  assignedLocations?: ServiceLocationAssignment[]
}

export interface ServiceLocationAssignment {
  locationId: string
  isActive: boolean
  price: number | null
}

// ─── Employee ─────────────────────────────────────────────────────────────────
export interface Employee {
  id: string
  userId: string
  locationId: string
  name: string
  avatar?: string
  bio?: string
  serviceIds: string[]   // IDs of services this employee performs
  commissionPercent: number
  isActive: boolean
}

export interface WorkingHours {
  employeeId: string
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6   // 0 = Sunday
  startTime: string   // "09:00"
  endTime: string     // "19:00"
  isWorking: boolean
}

// ─── Client ───────────────────────────────────────────────────────────────────
export interface Client {
  id: string
  organizationId: string
  name: string
  email?: string
  phone: string
  avatar?: string
  notes?: string
  tags: ClientTag[]
  loyaltyPoints: number
  preferredLocationId?: string
  createdAt: string
}

export type ClientTag = 'vip' | 'new' | 'loyal' | 'at_risk' | 'blacklisted'

// ─── Appointment ──────────────────────────────────────────────────────────────
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface Appointment {
  id: string
  locationId: string
  employeeId: string
  clientId: string
  serviceId: string
  status: AppointmentStatus
  startsAt: string   // ISO string
  endsAt: string
  price?: number
  notes?: string
  rating?: number
  createdAt?: string
}

// ─── Schedule Block ────────────────────────────────────────────────────────────
export interface ScheduleBlock {
  id: string
  employeeId: string
  locationId: string
  reason: string
  startsAt: string
  endsAt: string
  isRecurring: boolean
}

// ─── Financial ────────────────────────────────────────────────────────────────
export interface FinancialSummary {
  locationId: string | 'all'
  period: 'day' | 'week' | 'month' | 'year'
  revenue: number
  appointments: number
  averageTicket: number
  occupancyRate: number
  noShowRate: number
  topService: string
  topEmployee: string
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  appointments: number
  label?: string
}


// ─── Location Schedule ────────────────────────────────────────────────────────
export interface LocationSchedule {
  locationId: string
  dayOfWeek:  0 | 1 | 2 | 3 | 4 | 5 | 6   // 0 = Sunday
  isOpen:     boolean
  openTime:   string   // "09:00"
  closeTime:  string   // "19:00"
}


// ─── Location Settings ───────────────────────────────────────────────────────
// Booking horizon modes:
//   rolling   → always open for the next X units from today
//   monthly   → opens on day N of each month for the following month
//   fixed     → opens on a specific date set manually
//   unlimited → always open, no future limit
export type BookingHorizonMode = 'rolling' | 'monthly' | 'fixed'
export type BookingHorizonUnit = 'days' | 'weeks' | 'months'

export interface LocationSettings {
  locationId:          string
  // Horizon mode
  horizonMode:         BookingHorizonMode
  // Rolling mode
  rollingValue:        number             // e.g. 2 (with unit = 'weeks' → 14 days)
  rollingUnit:         BookingHorizonUnit
  // Monthly mode — opens on day N of the month for the next month
  monthlyOpenDay:      number             // 1–28
  // Fixed mode — manually set open-until date
  fixedOpenUntil:      string             // 'yyyy-MM-dd'
  // Common
  minAdvanceHours:     number
  slotIntervalMins:    number
}
// ─── Location Closure ────────────────────────────────────────────────────────
export interface LocationClosure {
  id:         string
  locationId: string
  startDate:  string   // "yyyy-MM-dd"
  endDate:    string   // "yyyy-MM-dd"
  reason:     string
  type:       'holiday' | 'vacation' | 'exceptional'
}
// ─── Notifications ────────────────────────────────────────────────────────────
export interface Notification {
  id: string
  userId: string
  type: 'appointment' | 'cancellation' | 'reminder' | 'system'
  title: string
  body: string
  isRead: boolean
  createdAt: string
}
