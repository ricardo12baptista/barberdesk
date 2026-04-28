import type { Organization, Location, User, Employee, Client, Service, Appointment, WorkingHours, LocationSchedule, LocationClosure, LocationSettings } from '@/models'

// ═══════════════════════════════════════════════════════════════════════════════
// ROLES — O QUE CADA UM VÊ E PODE FAZER
// ═══════════════════════════════════════════════════════════════════════════════
//
// super_admin (Proprietário)
//   • Acesso global a todas as lojas da organização
//   • locationId: null (não está amarrado a nenhuma loja específica)
//   • Pode criar/editar/apagar lojas, serviços, empregados, clientes
//   • Vê relatórios e financeiro de todas as lojas em simultâneo
//   • Gere plano de subscrição
//   • Se também é barbeiro: tem registo Employee associado ao seu userId
//   • Se não é barbeiro: não tem registo Employee — só gere, não trabalha
//
// manager (Gestor de Loja)
//   • Acesso limitado à sua loja (locationId sempre preenchido)
//   • Pode criar/editar marcações, empregados e clientes DA SUA LOJA
//   • Vê financeiro e relatórios da sua loja
//   • Não vê outras lojas nem dados globais
//   • Não pode alterar serviços (definidos pelo proprietário)
//   • Não pode alterar plano de subscrição
//
// employee (Barbeiro)
//   • Acesso muito restrito — só vê os SEUS próprios dados
//   • Vê a sua própria agenda (não a dos colegas)
//   • Vê os seus próprios clientes habituais
//   • Pode confirmar/completar as suas próprias marcações
//   • Não vê financeiro nem relatórios
//   • Não pode criar/editar empregados
//
// ═══════════════════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const today = new Date()
const d  = (h: number, m = 0) => { const dt = new Date(today); dt.setHours(h, m, 0, 0); return dt.toISOString() }
const d2 = (dayOffset: number, h: number, m = 0) => { const dt = new Date(today); dt.setDate(dt.getDate() + dayOffset); dt.setHours(h, m, 0, 0); return dt.toISOString() }


// ═══════════════════════════════════════════════════════════════════════════════
// CENÁRIO 1 — BarberKing (Enterprise)
// 1 proprietário NÃO barbeiro + 5 gestores + 5 lojas + 10 barbeiros
// ═══════════════════════════════════════════════════════════════════════════════
export const org1: Organization = {
  id: 'org-1', name: 'BarberKing', slug: 'barberking',
  plan: 'enterprise', createdAt: '2021-03-01T10:00:00Z',
}

export const locs1: Location[] = [
  { id: 'loc-1a', organizationId: 'org-1', name: 'Lisboa - Baixa',             address: 'Rua Augusta, 45',          city: 'Lisboa', phone: '+351 21 100 0001', email: 'baixa@barberking.pt',   timezone: 'Europe/Lisbon', isActive: true, createdAt: '2021-03-01T10:00:00Z' },
  { id: 'loc-1b', organizationId: 'org-1', name: 'Lisboa - Parque das Nações', address: 'Av. D. João II, 12',       city: 'Lisboa', phone: '+351 21 100 0002', email: 'parque@barberking.pt',  timezone: 'Europe/Lisbon', isActive: true, createdAt: '2021-09-01T10:00:00Z' },
  { id: 'loc-1c', organizationId: 'org-1', name: 'Porto - Aliados',            address: 'Av. dos Aliados, 88',      city: 'Porto',  phone: '+351 22 100 0003', email: 'aliados@barberking.pt', timezone: 'Europe/Lisbon', isActive: true, createdAt: '2022-03-15T10:00:00Z' },
  { id: 'loc-1d', organizationId: 'org-1', name: 'Porto - Foz',                address: 'Rua de Diu, 7',            city: 'Porto',  phone: '+351 22 100 0004', email: 'foz@barberking.pt',     timezone: 'Europe/Lisbon', isActive: true, createdAt: '2022-10-01T10:00:00Z' },
  { id: 'loc-1e', organizationId: 'org-1', name: 'Braga - Centro',             address: 'Rua do Souto, 30',         city: 'Braga',  phone: '+351 25 100 0005', email: 'braga@barberking.pt',   timezone: 'Europe/Lisbon', isActive: true, createdAt: '2023-06-01T10:00:00Z' },
]

// 1 proprietário (NÃO é barbeiro — só gere)
// 5 gestores (1 por loja)
// 10 barbeiros (2 por loja)
export const users1: User[] = [
  // Proprietário — sem locationId, sem registo Employee
  { id: 'u1-owner', organizationId: 'org-1', locationId: null,    name: 'Ricardo Mendes',  email: 'ricardo@barberking.pt',  role: 'super_admin', isActive: true, createdAt: '2021-03-01T10:00:00Z' },
  // Gestores
  { id: 'u1-mgr-a', organizationId: 'org-1', locationId: 'loc-1a', name: 'Sofia Carvalho',  email: 'sofia@barberking.pt',    role: 'manager',     isActive: true, createdAt: '2021-03-01T10:00:00Z' },
  { id: 'u1-mgr-b', organizationId: 'org-1', locationId: 'loc-1b', name: 'André Costa',     email: 'andre@barberking.pt',    role: 'manager',     isActive: true, createdAt: '2021-09-01T10:00:00Z' },
  { id: 'u1-mgr-c', organizationId: 'org-1', locationId: 'loc-1c', name: 'Patrícia Neves',  email: 'patricia@barberking.pt', role: 'manager',     isActive: true, createdAt: '2022-03-15T10:00:00Z' },
  { id: 'u1-mgr-d', organizationId: 'org-1', locationId: 'loc-1d', name: 'Bruno Fonseca',   email: 'bruno.f@barberking.pt',  role: 'manager',     isActive: true, createdAt: '2022-10-01T10:00:00Z' },
  { id: 'u1-mgr-e', organizationId: 'org-1', locationId: 'loc-1e', name: 'Inês Rodrigues',  email: 'ines@barberking.pt',     role: 'manager',     isActive: true, createdAt: '2023-06-01T10:00:00Z' },
  // Barbeiros Lisboa Baixa
  { id: 'u1-emp-1', organizationId: 'org-1', locationId: 'loc-1a', name: 'Tiago Costa',     email: 'tiago@barberking.pt',    role: 'employee',    isActive: true, createdAt: '2021-03-01T10:00:00Z' },
  { id: 'u1-emp-2', organizationId: 'org-1', locationId: 'loc-1a', name: 'Gonçalo Silva',   email: 'goncalo@barberking.pt',  role: 'employee',    isActive: true, createdAt: '2021-04-01T10:00:00Z' },
  // Barbeiros Parque
  { id: 'u1-emp-3', organizationId: 'org-1', locationId: 'loc-1b', name: 'Miguel Antunes',  email: 'miguel@barberking.pt',   role: 'employee',    isActive: true, createdAt: '2021-09-15T10:00:00Z' },
  { id: 'u1-emp-4', organizationId: 'org-1', locationId: 'loc-1b', name: 'Rui Pereira',     email: 'rui@barberking.pt',      role: 'employee',    isActive: true, createdAt: '2022-01-10T10:00:00Z' },
  // Barbeiros Porto Aliados
  { id: 'u1-emp-5', organizationId: 'org-1', locationId: 'loc-1c', name: 'Filipe Martins',  email: 'filipe@barberking.pt',   role: 'employee',    isActive: true, createdAt: '2022-03-15T10:00:00Z' },
  { id: 'u1-emp-6', organizationId: 'org-1', locationId: 'loc-1c', name: 'Carlos Lopes',    email: 'carlos@barberking.pt',   role: 'employee',    isActive: true, createdAt: '2022-04-01T10:00:00Z' },
  // Barbeiros Porto Foz
  { id: 'u1-emp-7', organizationId: 'org-1', locationId: 'loc-1d', name: 'Nuno Ferreira',   email: 'nuno@barberking.pt',     role: 'employee',    isActive: true, createdAt: '2022-10-01T10:00:00Z' },
  { id: 'u1-emp-8', organizationId: 'org-1', locationId: 'loc-1d', name: 'Pedro Alves',     email: 'pedro@barberking.pt',    role: 'employee',    isActive: true, createdAt: '2022-11-01T10:00:00Z' },
  // Barbeiros Braga
  { id: 'u1-emp-9', organizationId: 'org-1', locationId: 'loc-1e', name: 'Diogo Sousa',     email: 'diogo@barberking.pt',    role: 'employee',    isActive: true, createdAt: '2023-06-01T10:00:00Z' },
  { id: 'u1-emp-10',organizationId: 'org-1', locationId: 'loc-1e', name: 'Luís Cunha',      email: 'luis@barberking.pt',     role: 'employee',    isActive: true, createdAt: '2023-07-01T10:00:00Z' },
  // Parceiro — works at loc-1a independently, sees only own data
  { id: 'u1-partner', organizationId: 'org-1', locationId: 'loc-1a', name: 'Marco Vieira',    email: 'marco@barberking.pt',    role: 'partner',     isActive: true, createdAt: '2022-06-01T10:00:00Z' },
]

export const emps1: Employee[] = [
  { id: 'e1-1',  userId: 'u1-emp-1',  locationId: 'loc-1a', name: 'Tiago Costa',    serviceIds: ['svc-1-1', 'svc-1-2'], commissionPercent: 40, isActive: true },
  { id: 'e1-2',  userId: 'u1-emp-2',  locationId: 'loc-1a', name: 'Gonçalo Silva',  serviceIds: ['svc-1-3', 'svc-1-2'],       commissionPercent: 38, isActive: true },
  { id: 'e1-3',  userId: 'u1-emp-3',  locationId: 'loc-1b', name: 'Miguel Antunes', serviceIds: ['svc-1-4', 'svc-1-2'],  commissionPercent: 40, isActive: true },
  { id: 'e1-4',  userId: 'u1-emp-4',  locationId: 'loc-1b', name: 'Rui Pereira',    serviceIds: ['svc-1-5', 'svc-1-2'],     commissionPercent: 42, isActive: true },
  { id: 'e1-5',  userId: 'u1-emp-5',  locationId: 'loc-1c', name: 'Filipe Martins', serviceIds: ['svc-1-1', 'svc-1-3'],commissionPercent: 40, isActive: true },
  { id: 'e1-6',  userId: 'u1-emp-6',  locationId: 'loc-1c', name: 'Carlos Lopes',   serviceIds: ['svc-1-2'],        commissionPercent: 38, isActive: true },
  { id: 'e1-7',  userId: 'u1-emp-7',  locationId: 'loc-1d', name: 'Nuno Ferreira',  serviceIds: ['svc-1-4'],          commissionPercent: 40, isActive: true },
  { id: 'e1-8',  userId: 'u1-emp-8',  locationId: 'loc-1d', name: 'Pedro Alves',    serviceIds: ['svc-1-3', 'svc-1-6'],   commissionPercent: 40, isActive: true },
  { id: 'e1-9',  userId: 'u1-emp-9',  locationId: 'loc-1e', name: 'Diogo Sousa',    serviceIds: ['svc-1-1', 'svc-1-2'], commissionPercent: 42, isActive: true },
  { id: 'e1-10', userId: 'u1-emp-10', locationId: 'loc-1e', name: 'Luís Cunha',     serviceIds: ['svc-1-5', 'svc-1-3'],    commissionPercent: 38, isActive: true },
  { id: 'e1-p1', userId: 'u1-partner',  locationId: 'loc-1a', name: 'Marco Vieira',   serviceIds: ['svc-1-1', 'svc-1-2', 'svc-1-3'], commissionPercent: 50, isActive: true },
]


// ═══════════════════════════════════════════════════════════════════════════════
// CENÁRIO 2 — BarberStyle (Premium)
// 1 proprietário QUE É BARBEIRO + 2 gestores + 2 lojas + 3 barbeiros
// ═══════════════════════════════════════════════════════════════════════════════
export const org2: Organization = {
  id: 'org-2', name: 'BarberStyle', slug: 'barberstyle',
  plan: 'premium', createdAt: '2022-06-01T10:00:00Z',
}

export const locs2: Location[] = [
  { id: 'loc-2a', organizationId: 'org-2', name: 'Porto - Boavista',   address: 'Av. da Boavista, 1200', city: 'Porto',  phone: '+351 22 200 0001', email: 'boavista@barberstyle.pt', timezone: 'Europe/Lisbon', isActive: true, createdAt: '2022-06-01T10:00:00Z' },
  { id: 'loc-2b', organizationId: 'org-2', name: 'Matosinhos - Centro',address: 'Rua Brito Capelo, 55',  city: 'Matosinhos', phone: '+351 22 200 0002', email: 'matosinhos@barberstyle.pt', timezone: 'Europe/Lisbon', isActive: true, createdAt: '2023-02-01T10:00:00Z' },
]

// Proprietário tem locationId da sua loja principal onde também trabalha como barbeiro
export const users2: User[] = [
  // Proprietário É barbeiro — tem locationId e registo Employee
  { id: 'u2-owner', organizationId: 'org-2', locationId: 'loc-2a', name: 'João Barbeiro',    email: 'joao@barberstyle.pt',    role: 'super_admin', isActive: true, createdAt: '2022-06-01T10:00:00Z' },
  // Gestores
  { id: 'u2-mgr-a', organizationId: 'org-2', locationId: 'loc-2a', name: 'Marta Oliveira',   email: 'marta@barberstyle.pt',   role: 'manager',     isActive: true, createdAt: '2022-06-15T10:00:00Z' },
  { id: 'u2-mgr-b', organizationId: 'org-2', locationId: 'loc-2b', name: 'Paulo Monteiro',   email: 'paulo@barberstyle.pt',   role: 'manager',     isActive: true, createdAt: '2023-02-01T10:00:00Z' },
  // Barbeiros
  { id: 'u2-emp-1', organizationId: 'org-2', locationId: 'loc-2a', name: 'Fábio Santos',     email: 'fabio@barberstyle.pt',   role: 'employee',    isActive: true, createdAt: '2022-07-01T10:00:00Z' },
  { id: 'u2-emp-2', organizationId: 'org-2', locationId: 'loc-2b', name: 'Vasco Pinto',      email: 'vasco@barberstyle.pt',   role: 'employee',    isActive: true, createdAt: '2023-02-15T10:00:00Z' },
  { id: 'u2-emp-3', organizationId: 'org-2', locationId: 'loc-2b', name: 'Hugo Correia',     email: 'hugo@barberstyle.pt',    role: 'employee',    isActive: true, createdAt: '2023-04-01T10:00:00Z' },
]

export const emps2: Employee[] = [
  // Proprietário como barbeiro — userId aponta para o user super_admin
  { id: 'e2-owner', userId: 'u2-owner', locationId: 'loc-2a', name: 'João Barbeiro',  serviceIds: ['svc-2-1', 'svc-2-3', 'svc-2-2'], commissionPercent: 100, isActive: true },
  { id: 'e2-1',    userId: 'u2-emp-1', locationId: 'loc-2a', name: 'Fábio Santos',   serviceIds: ['svc-2-2'],                  commissionPercent: 42,  isActive: true },
  { id: 'e2-2',    userId: 'u2-emp-2', locationId: 'loc-2b', name: 'Vasco Pinto',    serviceIds: ['svc-2-4'],       commissionPercent: 40,  isActive: true },
  { id: 'e2-3',    userId: 'u2-emp-3', locationId: 'loc-2b', name: 'Hugo Correia',   serviceIds: ['svc-2-3', 'svc-2-2'],                     commissionPercent: 38,  isActive: true },
]


// ═══════════════════════════════════════════════════════════════════════════════
// CENÁRIO 3 — CorteFino (Pro)
// 1 proprietário QUE É BARBEIRO + 1 gestor + 1 loja + 1 barbeiro (+ o próprio)
// ═══════════════════════════════════════════════════════════════════════════════
export const org3: Organization = {
  id: 'org-3', name: 'CorteFino', slug: 'cortefino',
  plan: 'pro', createdAt: '2023-01-15T10:00:00Z',
}

export const locs3: Location[] = [
  { id: 'loc-3a', organizationId: 'org-3', name: 'CorteFino - Cascais', address: 'Rua Frederico Arouca, 28', city: 'Cascais', phone: '+351 21 300 0001', email: 'geral@cortefino.pt', timezone: 'Europe/Lisbon', isActive: true, createdAt: '2023-01-15T10:00:00Z' },
]

export const users3: User[] = [
  // Proprietário É barbeiro
  { id: 'u3-owner', organizationId: 'org-3', locationId: 'loc-3a', name: 'Sérgio Matos',   email: 'sergio@cortefino.pt', role: 'super_admin', isActive: true, createdAt: '2023-01-15T10:00:00Z' },
  // Gestor
  { id: 'u3-mgr',   organizationId: 'org-3', locationId: 'loc-3a', name: 'Ana Ferreira',   email: 'ana@cortefino.pt',    role: 'manager',     isActive: true, createdAt: '2023-01-20T10:00:00Z' },
  // 1 Barbeiro adicional
  { id: 'u3-emp-1', organizationId: 'org-3', locationId: 'loc-3a', name: 'Marco Vieira',   email: 'marco@cortefino.pt',  role: 'employee',    isActive: true, createdAt: '2023-03-01T10:00:00Z' },
]

export const emps3: Employee[] = [
  { id: 'e3-owner', userId: 'u3-owner', locationId: 'loc-3a', name: 'Sérgio Matos', serviceIds: ['svc-3-1', 'svc-3-2', 'svc-3-3'], commissionPercent: 100, isActive: true },
  { id: 'e3-1',    userId: 'u3-emp-1', locationId: 'loc-3a', name: 'Marco Vieira', serviceIds: ['svc-3-1', 'svc-3-2', 'svc-3-3'],          commissionPercent: 45,  isActive: true },
]


// ═══════════════════════════════════════════════════════════════════════════════
// CENÁRIO 4 — Barbearia do Zé (Básico)
// 1 proprietário QUE É O ÚNICO BARBEIRO — solo completo
// ═══════════════════════════════════════════════════════════════════════════════
export const org4: Organization = {
  id: 'org-4', name: 'Barbearia do Zé', slug: 'barbearia-ze',
  plan: 'basic', createdAt: '2024-03-01T10:00:00Z',
}

export const locs4: Location[] = [
  { id: 'loc-4a', organizationId: 'org-4', name: 'Barbearia do Zé', address: 'Rua das Flores, 12', city: 'Braga', phone: '+351 912 000 001', email: 'ze@barbeariadoze.pt', timezone: 'Europe/Lisbon', isActive: true, createdAt: '2024-03-01T10:00:00Z' },
]

export const users4: User[] = [
  { id: 'u4-owner', organizationId: 'org-4', locationId: 'loc-4a', name: 'José Barbeiro', email: 'ze@barbeariadoze.pt', role: 'super_admin', isActive: true, createdAt: '2024-03-01T10:00:00Z' },
]

export const emps4: Employee[] = [
  { id: 'e4-owner', userId: 'u4-owner', locationId: 'loc-4a', name: 'José Barbeiro', serviceIds: ['svc-4-1', 'svc-4-2', 'svc-4-3'], commissionPercent: 100, isActive: true },
]


// ═══════════════════════════════════════════════════════════════════════════════
// CREDENCIAIS DE ACESSO — todos os cenários
// ═══════════════════════════════════════════════════════════════════════════════
export const mockCredentials = [
  // ── Cenário 1: BarberKing ──
  { email: 'ricardo@barberking.pt',  password: 'admin123',    userId: 'u1-owner'  },  // Proprietário (não barbeiro)
  { email: 'sofia@barberking.pt',    password: 'manager123',  userId: 'u1-mgr-a'  },  // Gestora Lisboa Baixa
  { email: 'tiago@barberking.pt',    password: 'emp123',      userId: 'u1-emp-1'  },  // Barbeiro Lisboa Baixa
  { email: 'marco@barberking.pt',    password: 'partner123',  userId: 'u1-partner' },  // Parceiro Lisboa Baixa
  // ── Cenário 2: BarberStyle ──
  { email: 'joao@barberstyle.pt',    password: 'admin123',    userId: 'u2-owner'  },  // Proprietário (é barbeiro)
  { email: 'marta@barberstyle.pt',   password: 'manager123',  userId: 'u2-mgr-a'  },  // Gestora Porto Boavista
  { email: 'fabio@barberstyle.pt',   password: 'emp123',      userId: 'u2-emp-1'  },  // Barbeiro Porto Boavista
  // ── Cenário 3: CorteFino ──
  { email: 'sergio@cortefino.pt',    password: 'admin123',    userId: 'u3-owner'  },  // Proprietário (é barbeiro)
  { email: 'ana@cortefino.pt',       password: 'manager123',  userId: 'u3-mgr'    },  // Gestora
  { email: 'marco@cortefino.pt',     password: 'emp123',      userId: 'u3-emp-1'  },  // Barbeiro
  // ── Cenário 4: Barbearia do Zé ──
  { email: 'ze@barbeariadoze.pt',    password: 'admin123',    userId: 'u4-owner'  },  // Solo
]


// ═══════════════════════════════════════════════════════════════════════════════
// DADOS AGREGADOS (para os handlers MSW)
// ═══════════════════════════════════════════════════════════════════════════════
export const mockOrganizations = [org1, org2, org3, org4]
export const mockLocations     = [...locs1, ...locs2, ...locs3, ...locs4]
export const mockUsers         = [...users1, ...users2, ...users3, ...users4]
export const mockEmployees     = [...emps1, ...emps2, ...emps3, ...emps4]


// ─────────────────────────────────────────────────────────────────────────────
// SERVIÇOS — partilhados por organização (preços base, podem variar por loja)
// ─────────────────────────────────────────────────────────────────────────────
export const mockServices: Service[] = [
  // Org 1 — BarberKing
  { id: 'svc-1-1', organizationId: 'org-1', name: 'Corte Clássico',     durationMinutes: 30, basePrice: 15, category: 'hair',      isActive: true, color: '#6366f1' },
  { id: 'svc-1-2', organizationId: 'org-1', name: 'Fade / Degradê',     durationMinutes: 45, basePrice: 18, category: 'hair',      isActive: true, color: '#8b5cf6' },
  { id: 'svc-1-3', organizationId: 'org-1', name: 'Barba Completa',     durationMinutes: 30, basePrice: 12, category: 'beard',     isActive: true, color: '#f59e0b' },
  { id: 'svc-1-4', organizationId: 'org-1', name: 'Corte + Barba',      durationMinutes: 60, basePrice: 25, category: 'combo',     isActive: true, color: '#22c55e' },
  { id: 'svc-1-5', organizationId: 'org-1', name: 'Tratamento Capilar', durationMinutes: 45, basePrice: 20, category: 'treatment', isActive: true, color: '#ec4899' },
  { id: 'svc-1-6', organizationId: 'org-1', name: 'Sobrancelha',        durationMinutes: 15, basePrice:  8, category: 'other',     isActive: true, color: '#14b8a6' },
  // Org 2 — BarberStyle
  { id: 'svc-2-1', organizationId: 'org-2', name: 'Corte Clássico',     durationMinutes: 30, basePrice: 16, category: 'hair',      isActive: true, color: '#6366f1' },
  { id: 'svc-2-2', organizationId: 'org-2', name: 'Fade',               durationMinutes: 45, basePrice: 20, category: 'hair',      isActive: true, color: '#8b5cf6' },
  { id: 'svc-2-3', organizationId: 'org-2', name: 'Barba',              durationMinutes: 25, basePrice: 12, category: 'beard',     isActive: true, color: '#f59e0b' },
  { id: 'svc-2-4', organizationId: 'org-2', name: 'Corte + Barba',      durationMinutes: 55, basePrice: 26, category: 'combo',     isActive: true, color: '#22c55e' },
  // Org 3 — CorteFino
  { id: 'svc-3-1', organizationId: 'org-3', name: 'Corte Clássico',     durationMinutes: 30, basePrice: 18, category: 'hair',      isActive: true, color: '#6366f1' },
  { id: 'svc-3-2', organizationId: 'org-3', name: 'Fade',               durationMinutes: 40, basePrice: 22, category: 'hair',      isActive: true, color: '#8b5cf6' },
  { id: 'svc-3-3', organizationId: 'org-3', name: 'Barba',              durationMinutes: 25, basePrice: 14, category: 'beard',     isActive: true, color: '#f59e0b' },
  { id: 'svc-3-4', organizationId: 'org-3', name: 'Corte + Barba',      durationMinutes: 55, basePrice: 30, category: 'combo',     isActive: true, color: '#22c55e' },
  // Org 4 — Barbearia do Zé
  { id: 'svc-4-1', organizationId: 'org-4', name: 'Corte Clássico',     durationMinutes: 30, basePrice: 12, category: 'hair',      isActive: true, color: '#6366f1' },
  { id: 'svc-4-2', organizationId: 'org-4', name: 'Barba',              durationMinutes: 20, basePrice:  8, category: 'beard',     isActive: true, color: '#f59e0b' },
  { id: 'svc-4-3', organizationId: 'org-4', name: 'Corte + Barba',      durationMinutes: 50, basePrice: 18, category: 'combo',     isActive: true, color: '#22c55e' },
]


// ─────────────────────────────────────────────────────────────────────────────
// CLIENTES — por organização
// ─────────────────────────────────────────────────────────────────────────────
export const mockClients: Client[] = [
  // Org 1
  { id: 'cli-1-1', organizationId: 'org-1', name: 'Alexandre Sousa',   phone: '+351 910 001 001', tags: ['vip'],    loyaltyPoints: 850, createdAt: '2021-05-01T10:00:00Z' },
  { id: 'cli-1-2', organizationId: 'org-1', name: 'Bernardo Costa',    phone: '+351 910 001 002', tags: ['loyal'],  loyaltyPoints: 320, createdAt: '2021-08-10T10:00:00Z' },
  { id: 'cli-1-3', organizationId: 'org-1', name: 'Cristiano Neves',   phone: '+351 910 001 003', tags: ['new'],    loyaltyPoints:  20, createdAt: '2024-01-15T10:00:00Z' },
  { id: 'cli-1-4', organizationId: 'org-1', name: 'Duarte Pires',      phone: '+351 910 001 004', tags: ['at_risk'],loyaltyPoints:  75, createdAt: '2022-03-20T10:00:00Z' },
  { id: 'cli-1-5', organizationId: 'org-1', name: 'Eduardo Rocha',     phone: '+351 910 001 005', tags: ['loyal'],  loyaltyPoints: 440, createdAt: '2022-07-05T10:00:00Z' },
  { id: 'cli-1-6', organizationId: 'org-1', name: 'Fernando Lima',     phone: '+351 910 001 006', tags: ['vip'],    loyaltyPoints: 1200,createdAt: '2021-04-01T10:00:00Z' },
  // Org 2
  { id: 'cli-2-1', organizationId: 'org-2', name: 'Gabriel Mendes',    phone: '+351 920 002 001', tags: ['loyal'],  loyaltyPoints: 280, createdAt: '2022-07-01T10:00:00Z' },
  { id: 'cli-2-2', organizationId: 'org-2', name: 'Henrique Faria',    phone: '+351 920 002 002', tags: ['vip'],    loyaltyPoints: 560, createdAt: '2022-08-15T10:00:00Z' },
  { id: 'cli-2-3', organizationId: 'org-2', name: 'Ivo Carvalho',      phone: '+351 920 002 003', tags: ['new'],    loyaltyPoints:  10, createdAt: '2024-02-01T10:00:00Z' },
  // Org 3
  { id: 'cli-3-1', organizationId: 'org-3', name: 'Jacinto Barbosa',   phone: '+351 930 003 001', tags: ['loyal'],  loyaltyPoints: 190, createdAt: '2023-02-01T10:00:00Z' },
  { id: 'cli-3-2', organizationId: 'org-3', name: 'Kevin Azevedo',     phone: '+351 930 003 002', tags: ['new'],    loyaltyPoints:  30, createdAt: '2024-01-10T10:00:00Z' },
  // Org 4
  { id: 'cli-4-1', organizationId: 'org-4', name: 'Leonel Teixeira',   phone: '+351 940 004 001', tags: ['loyal'],  loyaltyPoints: 140, createdAt: '2024-03-10T10:00:00Z' },
  { id: 'cli-4-2', organizationId: 'org-4', name: 'Manuel Correia',    phone: '+351 940 004 002', tags: ['vip'],    loyaltyPoints: 200, createdAt: '2024-03-15T10:00:00Z' },
  { id: 'cli-4-3', organizationId: 'org-4', name: 'Norberto Gomes',    phone: '+351 940 004 003', tags: ['new'],    loyaltyPoints:   5, createdAt: '2024-05-01T10:00:00Z' },
]


// ─────────────────────────────────────────────────────────────────────────────
// MARCAÇÕES de hoje — por cenário
// ─────────────────────────────────────────────────────────────────────────────
export const mockAppointments: Appointment[] = [
  // ── Cenário 1 — Lisboa Baixa (e1-1: Tiago, e1-2: Gonçalo) ──
  { id: 'apt-1-1', locationId: 'loc-1a', employeeId: 'e1-1', clientId: 'cli-1-1', serviceId: 'svc-1-1', status: 'completed',   startsAt: d(9,  0), endsAt: d(9,  30), price: 15, createdAt: d(8,0) },
  { id: 'apt-1-2', locationId: 'loc-1a', employeeId: 'e1-1', clientId: 'cli-1-2', serviceId: 'svc-1-4', status: 'confirmed',   startsAt: d(10, 0), endsAt: d(11,  0), price: 25, createdAt: d(9,0) },
  { id: 'apt-1-3', locationId: 'loc-1a', employeeId: 'e1-1', clientId: 'cli-1-5', serviceId: 'svc-1-2', status: 'pending',     startsAt: d(14, 0), endsAt: d(14, 45), price: 18, createdAt: d(12,0) },
  { id: 'apt-1-4', locationId: 'loc-1a', employeeId: 'e1-2', clientId: 'cli-1-3', serviceId: 'svc-1-3', status: 'confirmed',   startsAt: d(9, 30), endsAt: d(10,  0), price: 12, createdAt: d(8,0) },
  { id: 'apt-1-5', locationId: 'loc-1a', employeeId: 'e1-2', clientId: 'cli-1-4', serviceId: 'svc-1-2', status: 'in_progress', startsAt: d(11, 0), endsAt: d(11, 45), price: 18, createdAt: d(10,0) },
  { id: 'apt-1-6', locationId: 'loc-1a', employeeId: 'e1-2', clientId: 'cli-1-6', serviceId: 'svc-1-1', status: 'no_show',     startsAt: d(13, 0), endsAt: d(13, 30), price: 15, createdAt: d(11,0) },
  // ── Cenário 1 — Parque das Nações (e1-3: Miguel, e1-4: Rui) ──
  { id: 'apt-1b-1', locationId: 'loc-1b', employeeId: 'e1-3', clientId: 'cli-1-1', serviceId: 'svc-1-4', status: 'completed',   startsAt: d(9,  0), endsAt: d(10,  0), price: 25, createdAt: d(8,0) },
  { id: 'apt-1b-2', locationId: 'loc-1b', employeeId: 'e1-3', clientId: 'cli-1-2', serviceId: 'svc-1-2', status: 'confirmed',   startsAt: d(10, 30), endsAt: d(11, 15), price: 18, createdAt: d(9,0) },
  { id: 'apt-1b-3', locationId: 'loc-1b', employeeId: 'e1-3', clientId: 'cli-1-5', serviceId: 'svc-1-1', status: 'confirmed',   startsAt: d(14, 0), endsAt: d(14, 30), price: 15, createdAt: d(12,0) },
  { id: 'apt-1b-4', locationId: 'loc-1b', employeeId: 'e1-3', clientId: 'cli-1-6', serviceId: 'svc-1-5', status: 'pending',     startsAt: d(16, 0), endsAt: d(16, 45), price: 20, createdAt: d(14,0) },
  { id: 'apt-1b-5', locationId: 'loc-1b', employeeId: 'e1-4', clientId: 'cli-1-3', serviceId: 'svc-1-2', status: 'completed',   startsAt: d(9, 15), endsAt: d(10,  0), price: 18, createdAt: d(8,0) },
  { id: 'apt-1b-6', locationId: 'loc-1b', employeeId: 'e1-4', clientId: 'cli-1-4', serviceId: 'svc-1-3', status: 'no_show',     startsAt: d(11, 0), endsAt: d(11, 30), price: 12, createdAt: d(10,0) },
  { id: 'apt-1b-7', locationId: 'loc-1b', employeeId: 'e1-4', clientId: 'cli-1-1', serviceId: 'svc-1-1', status: 'confirmed',   startsAt: d(15, 0), endsAt: d(15, 30), price: 15, createdAt: d(13,0) },
  // ── Cenário 1 — Porto Aliados (e1-5: Filipe, e1-6: Carlos) ──
  { id: 'apt-1c-1', locationId: 'loc-1c', employeeId: 'e1-5', clientId: 'cli-1-2', serviceId: 'svc-1-1', status: 'completed',   startsAt: d(9,  0), endsAt: d(9,  30), price: 15, createdAt: d(8,0) },
  { id: 'apt-1c-2', locationId: 'loc-1c', employeeId: 'e1-5', clientId: 'cli-1-5', serviceId: 'svc-1-4', status: 'completed',   startsAt: d(10, 0), endsAt: d(11,  0), price: 25, createdAt: d(9,0) },
  { id: 'apt-1c-3', locationId: 'loc-1c', employeeId: 'e1-5', clientId: 'cli-1-3', serviceId: 'svc-1-2', status: 'confirmed',   startsAt: d(14, 0), endsAt: d(14, 45), price: 18, createdAt: d(12,0) },
  { id: 'apt-1c-4', locationId: 'loc-1c', employeeId: 'e1-5', clientId: 'cli-1-6', serviceId: 'svc-1-3', status: 'pending',     startsAt: d(16, 30), endsAt: d(17, 0), price: 12, createdAt: d(15,0) },
  { id: 'apt-1c-5', locationId: 'loc-1c', employeeId: 'e1-6', clientId: 'cli-1-1', serviceId: 'svc-1-2', status: 'confirmed',   startsAt: d(9, 30), endsAt: d(10, 15), price: 18, createdAt: d(8,0) },
  { id: 'apt-1c-6', locationId: 'loc-1c', employeeId: 'e1-6', clientId: 'cli-1-4', serviceId: 'svc-1-1', status: 'confirmed',   startsAt: d(11, 0), endsAt: d(11, 30), price: 15, createdAt: d(10,0) },
  { id: 'apt-1c-7', locationId: 'loc-1c', employeeId: 'e1-6', clientId: 'cli-1-2', serviceId: 'svc-1-3', status: 'completed',   startsAt: d(13, 0), endsAt: d(13, 30), price: 12, createdAt: d(11,0) },
  // ── Cenário 1 — Porto Foz (e1-7: Nuno, e1-8: Pedro) ──
  { id: 'apt-1d-1', locationId: 'loc-1d', employeeId: 'e1-7', clientId: 'cli-1-3', serviceId: 'svc-1-4', status: 'completed',   startsAt: d(9,  0), endsAt: d(10,  0), price: 25, createdAt: d(8,0) },
  { id: 'apt-1d-2', locationId: 'loc-1d', employeeId: 'e1-7', clientId: 'cli-1-5', serviceId: 'svc-1-1', status: 'confirmed',   startsAt: d(10, 30), endsAt: d(11, 0), price: 15, createdAt: d(9,0) },
  { id: 'apt-1d-3', locationId: 'loc-1d', employeeId: 'e1-7', clientId: 'cli-1-1', serviceId: 'svc-1-3', status: 'confirmed',   startsAt: d(14, 0), endsAt: d(14, 30), price: 12, createdAt: d(12,0) },
  { id: 'apt-1d-4', locationId: 'loc-1d', employeeId: 'e1-7', clientId: 'cli-1-6', serviceId: 'svc-1-2', status: 'pending',     startsAt: d(15, 30), endsAt: d(16, 15), price: 18, createdAt: d(14,0) },
  { id: 'apt-1d-5', locationId: 'loc-1d', employeeId: 'e1-8', clientId: 'cli-1-4', serviceId: 'svc-1-6', status: 'completed',   startsAt: d(9, 30), endsAt: d(9,  45), price:  8, createdAt: d(8,0) },
  { id: 'apt-1d-6', locationId: 'loc-1d', employeeId: 'e1-8', clientId: 'cli-1-2', serviceId: 'svc-1-1', status: 'confirmed',   startsAt: d(11, 0), endsAt: d(11, 30), price: 15, createdAt: d(10,0) },
  { id: 'apt-1d-7', locationId: 'loc-1d', employeeId: 'e1-8', clientId: 'cli-1-5', serviceId: 'svc-1-3', status: 'no_show',     startsAt: d(13, 0), endsAt: d(13, 30), price: 12, createdAt: d(11,0) },
  // ── Cenário 1 — Braga Centro (e1-9: Diogo, e1-10: Luís) ──
  { id: 'apt-1e-1', locationId: 'loc-1e', employeeId: 'e1-9',  clientId: 'cli-1-1', serviceId: 'svc-1-2', status: 'completed',   startsAt: d(9,  0), endsAt: d(9,  45), price: 18, createdAt: d(8,0) },
  { id: 'apt-1e-2', locationId: 'loc-1e', employeeId: 'e1-9',  clientId: 'cli-1-3', serviceId: 'svc-1-1', status: 'confirmed',   startsAt: d(10, 0), endsAt: d(10, 30), price: 15, createdAt: d(9,0) },
  { id: 'apt-1e-3', locationId: 'loc-1e', employeeId: 'e1-9',  clientId: 'cli-1-5', serviceId: 'svc-1-4', status: 'confirmed',   startsAt: d(14, 0), endsAt: d(15,  0), price: 25, createdAt: d(12,0) },
  { id: 'apt-1e-4', locationId: 'loc-1e', employeeId: 'e1-9',  clientId: 'cli-1-6', serviceId: 'svc-1-5', status: 'pending',     startsAt: d(16, 0), endsAt: d(16, 45), price: 20, createdAt: d(15,0) },
  { id: 'apt-1e-5', locationId: 'loc-1e', employeeId: 'e1-10', clientId: 'cli-1-2', serviceId: 'svc-1-3', status: 'completed',   startsAt: d(9, 15), endsAt: d(9,  45), price: 12, createdAt: d(8,0) },
  { id: 'apt-1e-6', locationId: 'loc-1e', employeeId: 'e1-10', clientId: 'cli-1-4', serviceId: 'svc-1-2', status: 'confirmed',   startsAt: d(11, 0), endsAt: d(11, 45), price: 18, createdAt: d(10,0) },
  { id: 'apt-1e-7', locationId: 'loc-1e', employeeId: 'e1-10', clientId: 'cli-1-1', serviceId: 'svc-1-1', status: 'confirmed',   startsAt: d(13, 30), endsAt: d(14, 0), price: 15, createdAt: d(12,0) },
  // ── Cenário 2 — Porto Boavista (e2-owner: João, e2-1: Fábio) ──
  { id: 'apt-2-1', locationId: 'loc-2a', employeeId: 'e2-owner', clientId: 'cli-2-1', serviceId: 'svc-2-1', status: 'completed', startsAt: d(9,  0), endsAt: d(9,  30), price: 16, createdAt: d(8,0) },
  { id: 'apt-2-2', locationId: 'loc-2a', employeeId: 'e2-owner', clientId: 'cli-2-2', serviceId: 'svc-2-4', status: 'confirmed', startsAt: d(10, 0), endsAt: d(10, 55), price: 26, createdAt: d(9,0) },
  { id: 'apt-2-3', locationId: 'loc-2a', employeeId: 'e2-owner', clientId: 'cli-2-3', serviceId: 'svc-2-2', status: 'pending',   startsAt: d(15, 0), endsAt: d(15, 45), price: 20, createdAt: d(12,0) },
  { id: 'apt-2-4', locationId: 'loc-2a', employeeId: 'e2-1',     clientId: 'cli-2-1', serviceId: 'svc-2-3', status: 'confirmed', startsAt: d(9, 30), endsAt: d(9,  55), price: 12, createdAt: d(8,0) },
  { id: 'apt-2-5', locationId: 'loc-2a', employeeId: 'e2-1',     clientId: 'cli-2-2', serviceId: 'svc-2-2', status: 'confirmed', startsAt: d(11, 0), endsAt: d(11, 45), price: 20, createdAt: d(10,0) },
  // ── Cenário 2 — Matosinhos Centro (e2-2: Vasco, e2-3: Hugo) ──
  { id: 'apt-2b-1', locationId: 'loc-2b', employeeId: 'e2-2', clientId: 'cli-2-1', serviceId: 'svc-2-4', status: 'completed',   startsAt: d(9,  0), endsAt: d(9,  55), price: 26, createdAt: d(8,0) },
  { id: 'apt-2b-2', locationId: 'loc-2b', employeeId: 'e2-2', clientId: 'cli-2-3', serviceId: 'svc-2-1', status: 'confirmed',   startsAt: d(10, 30), endsAt: d(11, 0), price: 16, createdAt: d(9,0) },
  { id: 'apt-2b-3', locationId: 'loc-2b', employeeId: 'e2-2', clientId: 'cli-2-2', serviceId: 'svc-2-2', status: 'pending',     startsAt: d(14, 0), endsAt: d(14, 45), price: 20, createdAt: d(12,0) },
  { id: 'apt-2b-4', locationId: 'loc-2b', employeeId: 'e2-3', clientId: 'cli-2-2', serviceId: 'svc-2-3', status: 'completed',   startsAt: d(9, 30), endsAt: d(9,  55), price: 12, createdAt: d(8,0) },
  { id: 'apt-2b-5', locationId: 'loc-2b', employeeId: 'e2-3', clientId: 'cli-2-1', serviceId: 'svc-2-1', status: 'confirmed',   startsAt: d(11, 0), endsAt: d(11, 30), price: 16, createdAt: d(10,0) },
  { id: 'apt-2b-6', locationId: 'loc-2b', employeeId: 'e2-3', clientId: 'cli-2-3', serviceId: 'svc-2-4', status: 'no_show',     startsAt: d(13, 0), endsAt: d(13, 55), price: 26, createdAt: d(11,0) },
  // ── Cenário 3 — Cascais (e3-owner: Sérgio, e3-1: Marco) ──
  { id: 'apt-3-1', locationId: 'loc-3a', employeeId: 'e3-owner', clientId: 'cli-3-1', serviceId: 'svc-3-1', status: 'completed',   startsAt: d(9,  0), endsAt: d(9,  30), price: 18, createdAt: d(8,0) },
  { id: 'apt-3-2', locationId: 'loc-3a', employeeId: 'e3-owner', clientId: 'cli-3-2', serviceId: 'svc-3-4', status: 'confirmed',   startsAt: d(11, 0), endsAt: d(11, 55), price: 30, createdAt: d(9,0) },
  { id: 'apt-3-3', locationId: 'loc-3a', employeeId: 'e3-owner', clientId: 'cli-3-1', serviceId: 'svc-3-3', status: 'pending',     startsAt: d(14, 0), endsAt: d(14, 25), price: 14, createdAt: d(12,0) },
  { id: 'apt-3-4', locationId: 'loc-3a', employeeId: 'e3-1',     clientId: 'cli-3-2', serviceId: 'svc-3-2', status: 'in_progress', startsAt: d(10, 0), endsAt: d(10, 40), price: 22, createdAt: d(9,0) },
  // ── Cenário 4 — Barbearia do Zé (e4-owner: José, sozinho) ──
  { id: 'apt-4-1', locationId: 'loc-4a', employeeId: 'e4-owner', clientId: 'cli-4-1', serviceId: 'svc-4-1', status: 'completed', startsAt: d(9,  0), endsAt: d(9,  30), price: 12, createdAt: d(8,0) },
  { id: 'apt-4-2', locationId: 'loc-4a', employeeId: 'e4-owner', clientId: 'cli-4-2', serviceId: 'svc-4-3', status: 'confirmed', startsAt: d(10, 0), endsAt: d(10, 50), price: 18, createdAt: d(9,0) },
  { id: 'apt-4-3', locationId: 'loc-4a', employeeId: 'e4-owner', clientId: 'cli-4-3', serviceId: 'svc-4-2', status: 'pending',   startsAt: d(14, 0), endsAt: d(14, 20), price:  8, createdAt: d(12,0) },
  { id: 'apt-4-4', locationId: 'loc-4a', employeeId: 'e4-owner', clientId: 'cli-4-1', serviceId: 'svc-4-1', status: 'confirmed', startsAt: d(16, 0), endsAt: d(16, 30), price: 12, createdAt: d(14,0) },
]


// ─────────────────────────────────────────────────────────────────────────────
// HORÁRIOS DE TRABALHO
// ─────────────────────────────────────────────────────────────────────────────
function defaultHours(employeeId: string): WorkingHours[] {
  return [1,2,3,4,5].map(day => ({
    employeeId, dayOfWeek: day as 0|1|2|3|4|5|6,
    startTime: '09:00', endTime: '19:00', isWorking: true,
  })).concat([
    { employeeId, dayOfWeek: 6, startTime: '09:00', endTime: '14:00', isWorking: true  },
    { employeeId, dayOfWeek: 0, startTime: '09:00', endTime: '13:00', isWorking: false },
  ])
}

export const mockWorkingHours: WorkingHours[] = [
  ...mockEmployees.flatMap(e => defaultHours(e.id))
]



// ─────────────────────────────────────────────────────────────────────────────
// HORÁRIO DAS LOJAS
// ─────────────────────────────────────────────────────────────────────────────
function defaultLocationSchedule(locationId: string): LocationSchedule[] {
  return [
    { locationId, dayOfWeek: 1, isOpen: true,  openTime: '09:00', closeTime: '19:00' },
    { locationId, dayOfWeek: 2, isOpen: true,  openTime: '09:00', closeTime: '19:00' },
    { locationId, dayOfWeek: 3, isOpen: true,  openTime: '09:00', closeTime: '19:00' },
    { locationId, dayOfWeek: 4, isOpen: true,  openTime: '09:00', closeTime: '19:00' },
    { locationId, dayOfWeek: 5, isOpen: true,  openTime: '09:00', closeTime: '19:00' },
    { locationId, dayOfWeek: 6, isOpen: true,  openTime: '09:00', closeTime: '14:00' },
    { locationId, dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '13:00' },
  ]
}

export const mockLocationSchedules: LocationSchedule[] = [
  ...mockLocations.flatMap(l => defaultLocationSchedule(l.id))
]

// ─────────────────────────────────────────────────────────────────────────────
// ENCERRAMENTOS EXCEPCIONAIS
// ─────────────────────────────────────────────────────────────────────────────
export const mockLocationClosures: LocationClosure[] = [
  {
    id: 'cls-1', locationId: 'loc-1a', type: 'vacation',
    startDate: '2026-08-01', endDate: '2026-08-15',
    reason: 'Férias de Agosto',
  },
  {
    id: 'cls-2', locationId: 'loc-1a', type: 'holiday',
    startDate: '2026-06-10', endDate: '2026-06-10',
    reason: 'Dia de Portugal',
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// DEFINIÇÕES DE LOJA (booking horizon, etc.)
// ─────────────────────────────────────────────────────────────────────────────
export const mockLocationSettings: LocationSettings[] = [
  ...mockLocations.map(l => ({
    locationId:       l.id,
    horizonMode:      'rolling'  as const,
    rollingValue:     30,
    rollingUnit:      'days'     as const,
    monthlyOpenDay:   25,
    fixedOpenUntil:   '',
    minAdvanceHours:  1,
    slotIntervalMins: 30,
  }))
]

// ─────────────────────────────────────────────────────────────────────────────
// AUSÊNCIAS DE BARBEIRO (dias livres individuais)
// ─────────────────────────────────────────────────────────────────────────────
export interface EmployeeAbsence {
  id:         string
  employeeId: string
  locationId: string
  startDate:  string
  endDate:    string
  reason:     string
}

export const mockEmployeeAbsences: EmployeeAbsence[] = []

// ─────────────────────────────────────────────────────────────────────────────
// RECEITA (trend para dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export const mockRevenueTrend = Array.from({ length: 7 }, (_, i) => {
  const dt = new Date()
  dt.setDate(dt.getDate() - (6 - i))
  return {
    date:         dt.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric' }),
    revenue:      Math.floor(Math.random() * 400) + 150,
    appointments: Math.floor(Math.random() * 20)  + 8,
  }
})
