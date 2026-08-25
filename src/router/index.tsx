import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { can } from '@/permissions/abilities'
import { AppLayout } from '@/components/layout/AppLayout'

// ─── Backoffice pages ─────────────────────────────────────────────────────────
import { LoginPage }        from '@/pages/auth/LoginPage'
import { DashboardPage }    from '@/pages/dashboard/DashboardPage'
import { CalendarPage }     from '@/pages/calendar/CalendarPage'
import { AppointmentsPage } from '@/pages/appointments/AppointmentsPage'
import { EmployeesPage }    from '@/pages/employees/EmployeesPage'
import { ClientsPage }      from '@/pages/clients/ClientsPage'
import { ServicesPage }     from '@/pages/services/ServicesPage'
import { FinancialPage }    from '@/pages/financial/FinancialPage'
import { ReportsPage }      from '@/pages/reports/ReportsPage'
import { LocationsPage }    from '@/pages/locations/LocationsPage'
import { SettingsPage }     from '@/pages/settings/SettingsPage'
import { NotFoundPage }     from '@/pages/NotFoundPage'
import { SchedulePage }     from '@/pages/schedule/SchedulePage'

// ─── Public booking pages ─────────────────────────────────────────────────────
import { BookingPage }          from '@/booking/BookingPage'
import { BookingConfirmedPage } from '@/booking/BookingConfirmedPage'

// ─── Guards ───────────────────────────────────────────────────────────────────
function RequireAuth() {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireRole({ ability }: { ability: Parameters<typeof can>[1] }) {
  const { user } = useAuthStore()
  if (!user || !can(user.role, ability)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function RedirectIfAuthenticated() {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([

  // ── Public booking (no auth required) ──────────────────────────────────────
  { path: '/book/:orgSlug',             element: <BookingPage /> },
  { path: '/book/confirmed/:aptId',     element: <BookingConfirmedPage /> },

  // ── Backoffice auth ─────────────────────────────────────────────────────────
  {
    element: <RedirectIfAuthenticated />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },

  // ── Backoffice (protected) ──────────────────────────────────────────────────
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true,           element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard',    element: <DashboardPage />    },
          { path: '/calendar',     element: <CalendarPage />     },
          { path: '/appointments', element: <AppointmentsPage /> },
          { path: '/clients',      element: <ClientsPage />      },
          { path: '/services',     element: <ServicesPage />      },
          { path: '/settings',     element: <SettingsPage />     },
          { path: '/schedule',     element: <SchedulePage />     },

          // Manager + Super Admin
          {
            element: <RequireRole ability="employees:manage" />,
            children: [{ path: '/employees', element: <EmployeesPage /> }],
          },

          // Owner + Super Admin — ver todas as lojas da organização
          {
            element: <RequireRole ability="locations:view_all" />,
            children: [{ path: '/locations', element: <LocationsPage /> }],
          },

          // Super Admin + Manager + Partner
          {
            element: <RequireRole ability="financial:view_own" />,
            children: [{ path: '/financial', element: <FinancialPage /> }],
          },

          // All roles with reports access
          {
            element: <RequireRole ability="reports:view_own" />,
            children: [{ path: '/reports', element: <ReportsPage /> }],
          },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
])