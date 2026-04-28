# BarberDesk — Frontend Web

Sistema de gestão para barbearias e cadeias de barbearias.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + tokens CSS custom |
| Componentes | shadcn/ui (Radix primitivos) |
| Estado global | Zustand (auth + ui) |
| Server state | TanStack Query v5 |
| Formulários | React Hook Form + Zod |
| API mocking | Mock Service Worker (MSW) |
| Gráficos | Recharts |
| i18n | react-i18next (PT + EN) |
| Routing | React Router v6 |

---

## Estrutura

```
src/
├── api/          # Axios client + módulos por domínio
├── mocks/        # MSW handlers + seed data
├── hooks/        # TanStack Query hooks
├── stores/       # Zustand stores (auth, ui)
├── models/       # TypeScript interfaces
├── permissions/  # Sistema de roles e abilities
├── components/
│   ├── ui/       # Primitivos reutilizáveis
│   └── layout/   # Sidebar, Topbar, AppLayout
├── pages/        # Uma pasta por rota
├── lib/          # utils, i18n, constants
└── router/       # Definição de rotas + guards
```

---

## Roles

| Role | Acesso |
|------|--------|
| `super_admin` | Tudo — global ou por loja |
| `manager` | Apenas a sua loja |
| `employee` | Apenas os seus dados |

### Contas demo (MSW)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | ricardo@barberking.pt | admin123 |
| Manager | ana@barberking.pt | manager123 |
| Employee | tiago@barberking.pt | employee123 |

---

## Começar

```bash
npm install
npx msw init public/  # gera mockServiceWorker.js
npm run dev
```

---

## Variáveis de ambiente

```env
VITE_API_URL=/api           # URL base da API
VITE_ENABLE_MOCKS=true      # false = usa API real
```

---

## Integrar com API real

1. Definir `VITE_API_URL=https://api.teubackend.com` no `.env`
2. Definir `VITE_ENABLE_MOCKS=false`
3. O código de negócio (hooks, stores, pages) **não muda** — apenas o MSW é desactivado

---

## Multi-localização

O modelo de dados suporta múltiplas lojas nativamente:
- `Organization` → `Location[]` → `Employee[]` + `Appointment[]`
- O `activeLocation` no `UIStore` filtra todos os dados
- Super Admin pode ver `activeLocation = null` (visão global)

---

## Adicionar uma nova página

1. Criar `src/pages/nova-feature/NovaPage.tsx`
2. Adicionar rota em `src/router/index.tsx` (com guard de role se necessário)
3. Adicionar item de nav em `src/components/layout/Sidebar.tsx`
4. Adicionar handler MSW em `src/mocks/handlers.ts`
5. Adicionar hook em `src/hooks/index.ts`
