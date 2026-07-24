import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Mail, Building2 } from 'lucide-react'
import { useLocations } from '@/hooks'
import { PageHeader, Card, CardContent, Spinner, EmptyState } from '@/components/ui'

export function LocationsPage() {
  const { t }  = useTranslation()
  const { data: locations = [], isLoading } = useLocations()

  return (
    <div>
      <PageHeader
        title={t('nav.locations')}
        subtitle={`${locations.length} ${locations.length === 1 ? 'loja' : 'lojas'}`}
      />

      {isLoading ? <Spinner /> : locations.length === 0 ? (
        <Card><CardContent className="py-10">
          <EmptyState icon={Building2} title={t('common.noResults')} description="" />
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(loc => (
            <Card key={loc.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-foreground text-sm mb-3">{loc.name}</h3>
                <div className="space-y-1.5">
                  {loc.address && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground font-body">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{loc.address}, {loc.city}</span>
                    </div>
                  )}
                  {loc.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                      <Phone className="w-3.5 h-3.5" /><span>{loc.phone}</span>
                    </div>
                  )}
                  {loc.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                      <Mail className="w-3.5 h-3.5" /><span className="truncate">{loc.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}