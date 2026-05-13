// ─── Calendar ─────────────────────────────────────────────────────────────────
import { useTranslation } from 'react-i18next'
import { PageHeader, Card, CardContent, EmptyState } from '@/components/ui'
import { CalendarDays, Users, BarChart3, Building2, TrendingUp, Settings, FileText } from 'lucide-react'

function PlaceholderPage({ titleKey, icon: Icon }: { titleKey: string; icon: React.ElementType }) {
  const { t } = useTranslation()
  return (
    <div>
      <PageHeader title={t(titleKey)} />
      <Card>
        <CardContent className="py-8">
          <EmptyState
            icon={Icon}
            title="Em desenvolvimento"
            description={`Esta secção (${t(titleKey)}) está pronta na arquitectura e integração de dados — o UI completo será implementado na próxima iteração.`}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function CalendarPage() {
  return <PlaceholderPage titleKey="nav.calendar" icon={CalendarDays} />
}

export function AppointmentsPage() {
  return <PlaceholderPage titleKey="nav.appointments" icon={FileText} />
}

export function EmployeesPage() {
  return <PlaceholderPage titleKey="nav.employees" icon={Users} />
}

export function ServicesPage() {
  return <PlaceholderPage titleKey="nav.services" icon={BarChart3} />
}

export function FinancialPage() {
  return <PlaceholderPage titleKey="nav.financial" icon={TrendingUp} />
}

export function ReportsPage() {
  return <PlaceholderPage titleKey="nav.reports" icon={BarChart3} />
}

export function LocationsPage() {
  return <PlaceholderPage titleKey="nav.locations" icon={Building2} />
}

export function SettingsPage() {
  return <PlaceholderPage titleKey="nav.settings" icon={Settings} />
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <p className="font-display text-8xl font-bold text-primary/20">404</p>
        <h1 className="font-display text-2xl font-bold text-foreground mt-2">Página não encontrada</h1>
        <p className="text-muted-foreground font-body mt-1 mb-6">A página que procuras não existe ou foi movida.</p>
        <a href="/dashboard" className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-body">
          ← Voltar ao Dashboard
        </a>
      </div>
    </div>
  )
}
