import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, MapPin, Phone, Mail, Building2, Edit2, ToggleLeft, ToggleRight, XCircle } from 'lucide-react'
import { useLocations, useCreateLocation } from '@/hooks'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { PageHeader, Card, CardContent, Badge, Button, Spinner, EmptyState, Input } from '@/components/ui'
import { PLANS } from '@/lib/plans'
import { cn } from '@/lib/utils'
import type { Location } from '@/models'
import type { Plan } from '@/lib/plans'

function LocationModal({ location, orgId, onClose }: { location: Location | null; orgId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const isEdit    = !!location
  const createLoc = useCreateLocation()
  const [form, setForm] = useState({
    name:     location?.name     ?? '',
    address:  location?.address  ?? '',
    city:     location?.city     ?? '',
    phone:    location?.phone    ?? '',
    email:    location?.email    ?? '',
    timezone: location?.timezone ?? 'Europe/Lisbon',
    isActive: location?.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim()) { setError('Nome e cidade são obrigatórios.'); return }
    setSaving(true)
    try {
      await createLoc.mutateAsync({ ...form, organizationId: orgId })
      onClose()
    } catch { setError('Erro ao guardar.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-bold text-foreground text-base">
            {isEdit ? t('locations.editTitle') : t('locations.newTitle')}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 font-body">{error}</p>}
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground block mb-1.5">{t('locations.nameLabel')}</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground block mb-1.5">{t('locations.address')}</label>
            <Input value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground block mb-1.5">{t('locations.city')}</label>
              <Input value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground block mb-1.5">{t('locations.phone')}</label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground block mb-1.5">{t('clients.email')}</label>
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button size="sm" loading={saving} onClick={handleSave}>
            {isEdit ? t('locations.saveChanges') : t('locations.create')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function LocationsPage() {
  const { t }  = useTranslation()
  const { organization } = useAuthStore()
  const { canAddLocation } = useAppStore()
  const { data: locations = [], isLoading } = useLocations()

  const [modalOpen, setModalOpen] = useState(false)
  const [editLoc,   setEditLoc]   = useState<Location | null>(null)

  const plan       = (organization?.plan ?? 'basic') as Plan
  const planConfig = PLANS[plan]
  const atLimit    = !canAddLocation(plan)

  const openNew  = () => { setEditLoc(null); setModalOpen(true) }
  const openEdit = (l: Location) => { setEditLoc(l); setModalOpen(true) }

  return (
    <div>
      <PageHeader
        title={t('nav.locations')}
        subtitle={`${locations.length} / ${planConfig.maxLocations === -1 ? '∞' : planConfig.maxLocations} — ${planConfig.name}`}
        actions={
          <Button size="sm" onClick={openNew} disabled={atLimit} variant={atLimit ? 'outline' : 'primary'}>
            <Plus className="w-4 h-4" />{t('locations.newTitle')}
          </Button>
        }
      />

      {atLimit && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
          <Building2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-sm font-body text-amber-300">
            {t('locations.limitWarning', {
              max: planConfig.maxLocations,
              plural: planConfig.maxLocations === 1 ? '' : 's',
              plan: planConfig.name,
            })}
          </p>
        </div>
      )}

      {isLoading ? <Spinner /> : locations.length === 0 ? (
        <Card><CardContent className="py-10">
          <EmptyState icon={Building2} title={t('common.noResults')} description=""
            action={<Button size="sm" onClick={openNew}><Plus className="w-4 h-4" />{t('locations.create')}</Button>}
          />
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(loc => (
            <Card key={loc.id} className={cn('transition-all hover:border-primary/30', !loc.isActive && 'opacity-55')}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <Badge className={cn('text-[10px] border-0',
                    loc.isActive ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-400'
                  )}>
                    {loc.isActive ? t('locations.active') : t('locations.inactive')}
                  </Badge>
                </div>
                <h3 className="font-display font-bold text-foreground text-sm mb-3">{loc.name}</h3>
                <div className="space-y-1.5 mb-4">
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
                <div className="flex items-center gap-1 pt-3 border-t border-border">
                  <button onClick={() => openEdit(loc)}
                    className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-body text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Edit2 className="w-3 h-3" />{t('common.edit')}
                  </button>
                  <button className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-body text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto">
                    {loc.isActive
                      ? <><ToggleRight className="w-3 h-3" />{t('locations.deactivate')}</>
                      : <><ToggleLeft  className="w-3 h-3" />{t('locations.activate')}</>
                    }
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!atLimit && (
            <button onClick={openNew}
              className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 p-8 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/30 transition-all min-h-[200px]">
              <Plus className="w-6 h-6" />
              <span className="text-sm font-body">{t('locations.addSlot')}</span>
            </button>
          )}
        </div>
      )}

      {modalOpen && (
        <LocationModal location={editLoc} orgId={organization?.id ?? ''} onClose={() => { setModalOpen(false); setEditLoc(null) }} />
      )}
    </div>
  )
}
