# Arquitetura — BarberDesk

Visão rápida

BarberDesk é uma plataforma de agendamento para barbearias e cadeias, composta por: frontend público (fluxo de marcação), painel administrativo (backoffice) e backend (API). Esta documentação descreve a arquitetura do frontend (evidenciado no repositório), contratos HTTP observados através dos mocks e a arquitectura alvo para backend/backoffice, além de instruções práticas para a equipa de desenvolvimento.

Sumário

- O que é
- Stack e dependências principais
- Organização do repositório (frontend)
- Como executar o frontend localmente
- Contratos de API (extraídos dos mocks)
- Entidades de domínio (modelo conceitual)
- Fluxos principais
- Segurança / Roles
- Observabilidade, infra e deploy
- Pontos de risco / tech debt
- Próximos passos e checklist rápido

O que é

Uma aplicação web SPA (React + TypeScript) que implementa:
- fluxo público de booking (clientes sem sessão)
- backoffice para gestão (dashboard, calendar, clientes, serviços, funcionários, relatórios)

Stack (frontend observada)

- Linguagem: TypeScript
- Framework: React 18 + Vite
- Styling: Tailwind CSS + design tokens
- Component primitives: shadcn/ui (Radix)
- Estado global: Zustand
- Server state: TanStack Query v5
- Formulários: React Hook Form + Zod
- API mocking: MSW (Mock Service Worker)
- Gráficos: Recharts
- i18n: react-i18next
- Routing: react-router-dom v6

Estrutura principal (frontend)

```
src/
  api/          # Axios client + módulos por domínio
  mocks/        # MSW handlers + seed data
  hooks/        # TanStack Query hooks
  stores/       # Zustand stores (auth, ui)
  models/       # TypeScript interfaces
  permissions/  # Roles / abilities
  components/
    ui/         # primitives reutilizáveis
    layout/     # Sidebar, Topbar, AppLayout
  pages/        # páginas por rota (dashboard, calendar, ...)
  booking/      # fluxo público de marcação
  lib/          # utils, i18n, constants
  router/       # définition de rotas + guards
public/         # assets estáticos + mockServiceWorker.js
```

Como executar (mínimo)

```bash
npm install
npx msw init public/   # gera mockServiceWorker.js (dev)
npm run dev
```

Ambiente (exemplos no README):

- VITE_API_URL=/api
- VITE_ENABLE_MOCKS=true

Contratos de API (extraídos de src/mocks/handlers.ts)

Base: /api

Principais endpoints observados (sintaxe resumida)

- Auth
  - POST /api/auth/login { email, password } -> { user, organization, token }
  - POST /api/auth/logout

- Locations
  - GET /api/locations?organizationId=
  - GET /api/locations/:id
  - POST /api/locations

- Employees
  - GET /api/employees?locationId=
  - GET /api/employees/:id
  - GET /api/employees/:id/working-hours
  - POST /api/employees
  - PUT/PATCH/DELETE /api/employees/:id

- Clients
  - GET /api/clients?organizationId=&search=&page=&limit=
  - GET /api/clients/:id
  - POST /api/clients
  - PATCH /api/clients/:id
  - DELETE /api/clients/:id

- Services
  - GET /api/services?organizationId=
  - POST /api/services
  - PATCH/DELETE /api/services/:id

- Appointments
  - GET /api/appointments?locationId=&employeeId=&startsAt=&endsAt=&organizationId=
  - POST /api/appointments
  - PATCH /api/appointments/:id
  - PATCH /api/appointments/:id/status { status }
  - DELETE /api/appointments/:id

- Analytics / Reports
  - GET /api/analytics/summary?locationId=
  - GET /api/analytics/revenue-trend?locationId=&organizationId=&period=&refDate=
  - GET /api/analytics/reports?locationId=&employeeId=&startsAt=&endsAt=
  - GET /api/analytics/financial-summary?locationId=&organizationId=&period=&refDate=

- Public booking (no auth)
  - GET /api/public/organizations
  - GET /api/public/services?orgId=
  - GET /api/public/employees?locationId=&serviceId=
  - GET /api/public/slots?locationId=&serviceId=&date=&employeeId=
  - POST /api/public/book
  - GET /api/public/booking/:id

Regras importantes observadas

- Slots gerados considerando working hours, absences, closures, bookings existentes e horizon rules (rolling / monthly / fixed).
- Apenas funcionários que suportam o serviço (serviceIds) aparecem para esse serviço.
- Booking público pode criar cliente guest se o telefone não existir.
- Status de appointment: pending, confirmed, in_progress, completed, cancelled, no_show.

Entidades centrais (modelo conceitual)

- Organization
- Location (organizationId)
- Employee (locationId, serviceIds, workingHours)
- Client (organizationId)
- Service (organizationId, durationMinutes, basePrice)
- Appointment (clientId, employeeId, serviceId, locationId, startsAt, endsAt, status)
- WorkingHours, Absences, LocationSchedule, LocationClosures, LocationSettings

Fluxos principais (resumo)

- Login (POST /api/auth/login → guardar token, redirecionar para /dashboard)
- Booking público (listar services → slots → POST /api/public/book → confirmed)
- Calendar / backoffice (listar appointments por org/location → CRUD appointments)
- Analytics (dashboards chamam endpoints /api/analytics/*)

Segurança / Roles

- Roles base: super_admin (global), manager (por loja), employee (dados próprios)
- Frontend aplica guards por ability (RequireRole) mas backend deve validar regras invariavelmente

Infra / deploy (recomendações resumidas)

- Frontend: static build (Vite) → deploy em Vercel / Netlify / CDN
- Backend: Node.js + TypeScript (NestJS/Express/Fastify) com PostgreSQL
- CI: lint, typecheck, tests, build preview, deploy staging
- E2E: Playwright/Cypress para fluxo de booking e fluxos críticos
- Observability: Sentry + structured logs + metrics

Pontos de risco e dívida técnica

- Lógica de slots/availability duplicada entre mock (frontend) e backend: risco de desvio de comportamento
- Autorização feita client-side complementada, mas não substitui validação server-side
- Testes E2E não detectados no repo (priorizar)
- VITE_ENABLE_MOCKS default true exige cuidado para não ir a produção com mocks ativos

Próximos passos e checklist rápido

- Implementar backend real com endpoints compatíveis com os mocks (paridade)
- Criar OpenAPI / Swagger para contract-first e documentação de API
- Implementar validações server-side de roles / organization-scope
- Adicionar e2e tests para booking e rota de criação/actualização de appointments
- Produzir diagramas ERD e sequences (veja arquivo técnico)

Arquitetura documentada por: tech lead (auto-gerado)

---

Última atualização: documentação inicial carregada automaticamente no repositório.
