// ─────────────────────────────────────────────────────────────────────────────
//  Role definitions
//
//  super_admin  Proprietário    – owns the whole network; sees every location,
//                                 all barbers, global financials & reports
//  manager      Gestor de Loja  – full access to their assigned location;
//                                 sees all barbers there, location financials
//  partner      Parceiro        – same screens as manager but scoped to their
//                                 OWN appointments / clients / financials only
//  employee     Barbeiro        – own schedule & own clients only;
//                                 no financial data, no global reports
// ─────────────────────────────────────────────────────────────────────────────
export type Role = 'super_admin' | 'owner' | 'manager' | 'partner' | 'employee'

// ─── Ability Keys ─────────────────────────────────────────────────────────────
export type Ability =
  | 'dashboard:view_global'
  | 'dashboard:view_location'
  | 'dashboard:view_own'
  | 'locations:manage'
  | 'locations:view_all'
  | 'employees:manage'
  | 'employees:view_location'
  | 'employees:view_own'
  | 'clients:manage_all'
  | 'clients:view_own'
  | 'services:manage_global'
  | 'services:manage_location'
  | 'services:view'
  | 'calendar:view_all_employees'
  | 'calendar:view_own'
  | 'calendar:manage_appointments'
  | 'calendar:block_schedule'
  | 'appointments:view_all'
  | 'appointments:view_own'
  | 'financial:view_global'
  | 'financial:view_location'
  | 'financial:view_own'
  | 'reports:view_global'
  | 'reports:view_location'
  | 'reports:view_own'
  | 'settings:manage_global'
  | 'settings:manage_location'
  | 'settings:manage_own'

// ─── Permission Map ───────────────────────────────────────────────────────────
const PERMISSIONS: Record<Role, Ability[]> = {
  super_admin: [
    'dashboard:view_global', 'dashboard:view_location',
    'locations:manage', 'locations:view_all',
    'employees:manage', 'employees:view_location', 'employees:view_own',
    'clients:manage_all',
    'services:manage_global', 'services:manage_location', 'services:view',
    'calendar:view_all_employees', 'calendar:manage_appointments', 'calendar:block_schedule',
    'appointments:view_all',
    'financial:view_global', 'financial:view_location', 'financial:view_own',
    'reports:view_global', 'reports:view_location', 'reports:view_own',
    'settings:manage_global', 'settings:manage_location', 'settings:manage_own',
  ],
  // Dono da barbearia — acesso total à organização dele (todas as lojas),
  // mas SEM acesso ao backoffice global (exclusivo do super_admin)
  owner: [
    'dashboard:view_global', 'dashboard:view_location',
    'locations:view_all',
    'employees:manage', 'employees:view_location', 'employees:view_own',
    'clients:manage_all',
    'services:manage_global', 'services:manage_location', 'services:view',
    'calendar:view_all_employees', 'calendar:manage_appointments', 'calendar:block_schedule',
    'appointments:view_all',
    'financial:view_global', 'financial:view_location', 'financial:view_own',
    'reports:view_global', 'reports:view_location', 'reports:view_own',
    'settings:manage_global', 'settings:manage_location', 'settings:manage_own',
  ],
  manager: [
    'dashboard:view_location',
    'employees:manage', 'employees:view_location', 'employees:view_own',
    'clients:manage_all',
    'services:manage_location', 'services:view',
    'calendar:view_all_employees', 'calendar:manage_appointments', 'calendar:block_schedule',
    'appointments:view_all',
    'financial:view_location', 'financial:view_own',
    'reports:view_location', 'reports:view_own',
    'settings:manage_location', 'settings:manage_own',
  ],
  // Parceiro: same screens as manager but data scoped to own only
  partner: [
    'dashboard:view_own',
    'employees:view_location', 'employees:view_own',
    'clients:view_own',
    'services:view',
    'calendar:view_all_employees', 'calendar:view_own',
    'calendar:manage_appointments', 'calendar:block_schedule',
    'appointments:view_own',
    'financial:view_own',
    'reports:view_own',
    'settings:manage_own',
  ],
  employee: [
    'dashboard:view_own',
    'employees:view_own',
    'clients:view_own',
    'services:view',
    'calendar:view_own', 'calendar:manage_appointments',
    'appointments:view_own',
    'reports:view_own',
    'settings:manage_own',
  ],
}

export const can    = (role: Role, ability: Ability): boolean  => PERMISSIONS[role]?.includes(ability) ?? false
export const canAny = (role: Role, abilities: Ability[]): boolean => abilities.some(a => can(role, a))
