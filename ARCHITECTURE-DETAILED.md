# ARCHITECTURE-DETAILED.md

Documento técnico detalhado — BarberDesk

Este ficheiro complementa o ARCHITECTURE.md com diagramas textuais, esquema de base de dados proposto, endpoints com exemplos de payloads, fluxo de autenticação e um plano de implementação do backend.

1) Diagrama de alto nível (texto)

Cliente Web (Browser)
  └─> Frontend (React + Vite)
        ├─ Router: /book/* (public), /login, /dashboard, /calendar, /appointments...
        ├─ State: Zustand (auth, ui)
        └─ Server state: React Query (requests -> API)
  └─> Backend API (Node TypeScript)
        ├─ Auth Service (JWT)
        ├─ Appointments Service (slot calc, concurrency)
        ├─ People Service (employees, clients)
        ├─ Locations Service (schedule, closures, settings)
        ├─ Reports/Analytics Service
        └─ Persistence: PostgreSQL

2) Sequência simplificada - Booking público (resumo)

1. GET /api/public/organizations
2. GET /api/public/services?orgId=ORG
3. GET /api/public/employees?locationId=LOC&serviceId=SVC
4. GET /api/public/slots?locationId=LOC&serviceId=SVC&date=YYYY-MM-DD
   - Backend calcula horizon, filtra closures, working hours, absences e existing appointments.
5. POST /api/public/book { organizationId, locationId, serviceId, employeeId, startsAt, clientName, clientPhone, notes }
   - Backend: valida disponibilidade (re-check), cria client (guest se necessário), faz insert appointment (status: confirmed), devolve appointment id
6. Redirect to /book/confirmed/:id

Observação crítica:
- O backend deve revalidar disponibilidade no POST /api/public/book para evitar race conditions (usar transação DB e/ou lock/unique constraints com compensação).

3) Modelo de dados proposto (DDL conceptual)

-- Tabelas principais (simplificado)

organizations
  - id PK
  - name
  - slug UNIQUE
  - plan
  - is_active
  - created_at, updated_at

locations
  - id PK
  - organization_id FK -> organizations.id
  - name, address, city
  - is_active
  - timezone
  - created_at, updated_at

users
  - id PK
  - email UNIQUE
  - password_hash
  - role (super_admin|manager|employee)
  - organization_id FK (nullable for super_admin)
  - employee_id FK (nullable)
  - is_active
  - created_at

employees
  - id PK
  - name
  - location_id FK -> locations.id
  - service_ids (ARRAY) or separate employee_services table
  - avatar
  - is_active
  - created_at, updated_at

services
  - id PK
  - organization_id FK
  - name
  - duration_minutes
  - base_price
  - category
  - is_active

clients
  - id PK
  - organization_id FK
  - name
  - phone
  - tags (ARRAY)
  - loyalty_points
  - is_guest BOOLEAN
  - created_at

appointments
  - id PK
  - organization_id FK
  - location_id FK
  - employee_id FK
  - client_id FK
  - service_id FK
  - status (enum)
  - starts_at TIMESTAMP WITH TIME ZONE
  - ends_at TIMESTAMP WITH TIME ZONE
  - price NUMERIC
  - notes TEXT
  - created_at, updated_at

working_hours
  - id
  - employee_id
  - day_of_week INT (0-6)
  - start_time TEXT (HH:mm)
  - end_time TEXT (HH:mm)
  - is_working BOOLEAN

location_closures
  - id
  - location_id
  - start_date DATE
  - end_date DATE
  - reason

location_settings
  - location_id PK
  - horizon_mode ENUM (rolling|monthly|fixed)
  - rolling_value INT
  - rolling_unit ENUM (days|weeks|months)
  - monthly_open_day INT
  - fixed_open_until DATE
  - min_advance_hours INT
  - slot_interval_mins INT

employee_absences
  - id
  - employee_id
  - location_id
  - start_date DATE
  - end_date DATE
  - reason TEXT

Índices essenciais
- appointments(location_id, starts_at)
- appointments(employee_id, starts_at)
- employees(location_id)
- services(organization_id)
- clients(organization_id, phone)

4) Exemplo de payloads

POST /api/public/slots?locationId=loc1&serviceId=svc1&date=2026-10-14
- Response: [{ time: '09:00', startsAt: '2026-10-14T09:00:00Z', employeeId: 'emp-1', employeeName: 'João' }, ...]

POST /api/public/book
- Request:
{
  "organizationId": "org-1",
  "locationId": "loc-1",
  "serviceId": "svc-1",
  "employeeId": "emp-1",
  "startsAt": "2026-10-14T09:00:00Z",
  "clientName": "Cliente 1",
  "clientPhone": "+351 912 345 678",
  "notes": "Prefer barbeiro X"
}
- Response: { "appointmentId": "apt-123" }

POST /api/auth/login
- Request: { "email":"ricardo@barberking.pt","password":"admin123" }
- Response: { "user": {...}, "organization": {...}, "token": "mock-jwt-..." }

5) Concorrência e garantia de disponibilidade (recomendado)

- Em POST /api/public/book seguir este fluxo no backend:
  1. Iniciar transação
  2. Ler settings do location
  3. Recalcular slots / verificar se a slot solicitada está disponível (SELECT FOR UPDATE em estruturas que garantam consistência ou usar constraint sobre appointments para impedir overlap)
  4. Criar client (se necessário)
  5. Inserir appointment
  6. Commit

Alternativas:
- Usar fila (ex: Redis + worker) para serializar reservas em horários críticos
- Ou utilizar constraint/exclusion index no Postgres (range types) para evitar overlaps
a exemplo: EXCLUDE USING GIST (location_id WITH =, tsrange(starts_at, ends_at) WITH &&)

6) OpenAPI / documentação de API

- Prioridade: gerar um OpenAPI 3.0 com todos os endpoints listados neste ficheiro (contract-first) e publicar swagger.json / swagger-ui.
- O frontend pode usar esse OpenAPI para gerar tipos/clients (ex: openapi-typescript, or swagger-codegen) e garantir paridade com os mocks.

7) Testes

- Unit: jest / vitest para serviços e helpers (backend & frontend)
- Integration: testes para controllers + database (usar transactional tests com rollback)
- E2E: Playwright / Cypress cobrindo:
  - booking flow público
  - login + criar appointment no backoffice
  - mudança de status de appointment
  - permissões: usuário manager não vê dados de outra loja

8) CI/CD (exemplo de pipeline)

- On PR:
  - Install -> lint -> typecheck -> unit tests -> build
  - Run security scans (dependabot/secret scanning)
- On merge to main (staging): Build backend image, run DB migrations, deploy to staging
- On tag/release: deploy to production (blue/green or canary) + run smoke tests

9) Observability

- Enviar erros para Sentry (frontend + backend)
- Logs estruturados (JSON) + centralização (ELK / Datadog / Grafana Loki)
- Metrics: Prometheus metrics + Grafana dashboards

10) Checklist técnico para implementação do backend (prioridade)

- [ ] Criar esqueleto do backend em TypeScript (NestJS ou similar)
- [ ] Implementar Auth (JWT) + user/role model
- [ ] Implementar endpoints de locations, employees, services, clients, appointments conforme contratos
- [ ] Gerar OpenAPI e tipos para frontend
- [ ] Implementar cálculo de slots no backend com revalidação em criação de appointment
- [ ] Criar migrations e esquema PostgreSQL (incluir exclusion index para appointments)
- [ ] Implementar testes unit/integration/e2e
- [ ] Implementar CI pipelines e deploy pipeline
- [ ] Instrumentar logs e Sentry

11) Pendências / questões abertas (a confirmar com o código backend)

- Qual framework backend preferido (NestJS / Express / Fastify)?
- Existe contrato OpenAPI atual fornecido pelo backend?
- Como estão a gerir billing / planos (plan) e limites multi-loja?
- Existem jobs assíncronos para tasks (ex: reminders, SMS/email)?
- Estratégia de retenção e backups do banco?

12) Localização dos ficheiros que referenciam comportamentos importantes (frontend)

- src/mocks/handlers.ts  — contém os contratos & regras de negócio simuladas
- src/router/index.tsx   — guards de rota e abilities
- src/main.tsx           — bootstrap, MSW startup, QueryClient
- src/stores/*            — auth + ui state
- README.md              — instruções de arranque e roles demo

13) Próximos passos que eu executo se autorizado

- Gerar OpenAPI a partir dos mocks (esqueleto) e colocar em /docs/openapi.yaml
- Criar issues no repo com checklist (migrations, endpoints, tests, openapi)
- Implementar um exemplo mínimo do backend (endpoints críticos) — precisa de aprovação para criar novo repo ou subdiretório

---

Arquivo gerado automaticamente: arquitetura detalhada (versão inicial)

