import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Scissors, Clock, Euro, Edit2, Trash2, CheckCircle, XCircle, Tag, Store, Building2 } from 'lucide-react'
import { useServices, useCreateService, useUpdateService, useDeleteService, useLocations } from '@/hooks'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { servicesApi } from '@/api'
import { PageHeader, Card, CardContent, Badge, Button, Spinner, EmptyState, Input } from '@/components/ui'
import { formatCurrency, getDurationLabel, cn } from '@/lib/utils'
import type { Service } from '@/models'

const CATEGORY_COLORS: Record<string, string> = {
  hair:      'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  beard:     'bg-amber-500/15  text-amber-400  border-amber-500/30',
  combo:     'bg-green-500/15  text-green-400  border-green-500/30',
  treatment: 'bg-sky-500/15    text-sky-400    border-sky-500/30',
  other:     'bg-slate-500/15  text-slate-400  border-slate-500/30',
}

function ServiceModal({ service, orgId, onClose }: { service: (Service & { locationIds?: string[] }) | null; orgId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const { activeLocation } = useUIStore()
  const isEdit    = !!service
  const createSvc = useCreateService()
  const updateSvc = useUpdateService()
  const { data: locations = [] } = useLocations()

  const CATEGORIES: { key: string; label: string }[] = [
    { key: 'hair',      label: t('services.category.hair')      },
    { key: 'beard',     label: t('services.category.beard')     },
    { key: 'combo',     label: t('services.category.combo')     },
    { key: 'treatment', label: t('services.category.treatment') },
    { key: 'other',     label: t('services.category.other')     },
  ]

  // Existing assigned location IDs for this service
  const existingLocIds = service?.assignedLocations?.map(a => a.locationId) ?? []

  const [form, setForm] = useState({
    name:            service?.name            ?? '',
    category:        service?.category        ?? ('hair' as string),
    durationMinutes: service?.durationMinutes ?? 30,
    basePrice:       service?.basePrice       ?? 15,
    description:     service?.description     ?? '',
    color:           service?.color           ?? '#6366f1',
  })
  const [selectedLocIds, setSelectedLocIds] = useState<string[]>(
    service?.locationIds ?? existingLocIds ?? [activeLocation?.id ?? ''].filter(Boolean)
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const toggleLoc = (locId: string) => {
    setSelectedLocIds(prev =>
      prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
    )
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return }
    if (selectedLocIds.length === 0) { setError('Selecione pelo menos uma loja.'); return }
    setSaving(true)
    try {
      const payload = { ...form, category: form.category as Service['category'], locationIds: selectedLocIds }
      if (isEdit) await updateSvc.mutateAsync({ id: service!.id, data: payload })
      else        await createSvc.mutateAsync(payload)
      onClose()
    } catch { setError('Erro ao guardar. Tenta novamente.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-display font-bold text-foreground text-base">
            {isEdit ? 'Editar Serviço' : 'Novo Serviço'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 font-body">{error}</p>}

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground block mb-1.5">{t('services.name')}</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="ex: Corte Clássico" />
          </div>

          {/* Loja selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground block mb-1.5">
              Lojas <span className="text-muted-foreground/50">(selecione uma ou mais)</span>
            </label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {locations.map(loc => {
                const isSelected = selectedLocIds.includes(loc.id)
                return (
                  <button key={loc.id} type="button" onClick={() => toggleLoc(loc.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-body transition-all text-left',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                    )}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{loc.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground block mb-1.5">{t('services.category')}</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => set('category', c.key)}
                  className={cn('h-7 px-3 rounded-lg text-xs font-body font-medium border transition-all',
                    form.category === c.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >{c.label}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground block mb-1.5">{t('services.durationMin')}</label>
              <Input type="number" min={5} step={5} value={form.durationMinutes}
                onChange={e => set('durationMinutes', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground block mb-1.5">{t('services.basePrice')}</label>
              <Input type="number" min={0} step={0.5} value={form.basePrice}
                onChange={e => set('basePrice', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground block mb-1.5">
              {t('services.description')} <span className="text-muted-foreground/50">{t('services.optional')}</span>
            </label>
            <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground block mb-1.5">{t('services.agendaColor')}</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent p-1" />
              <span className="text-xs font-mono text-muted-foreground">{form.color}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button size="sm" loading={saving} onClick={handleSave}>
            {isEdit ? t('services.saveChanges') : t('services.create')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ServicesPage() {
  const { t } = useTranslation()
  const { organization, user } = useAuthStore()
  const { activeLocation } = useUIStore()
  const { data: services = [], isLoading } = useServices()
  const { data: locations = [] } = useLocations()
  const deleteSvc = useDeleteService()
  const qc = useQueryClient()

  const [modalService,  setModalService]  = useState<Service | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null)
  const canManage = user?.role === 'super_admin' || user?.role === 'manager'

  // Toggle per location
  const handleToggleLocation = async (svcId: string, locationId: string, currentlyActive: boolean) => {
    try {
      await servicesApi.toggleLocation(svcId, locationId, !currentlyActive)
      qc.invalidateQueries({ queryKey: ['services'] })
    } catch (err) {
      console.error('Error toggling service location:', err)
    }
  }

  // Location map for display
  const locMap = Object.fromEntries(locations.map(l => [l.id, l.name]))

  const currentLocId = activeLocation?.id ?? user?.locationId

  const CATEGORIES: { key: string; label: string }[] = [
    { key: 'hair',      label: t('services.category.hair')      },
    { key: 'beard',     label: t('services.category.beard')     },
    { key: 'combo',     label: t('services.category.combo')     },
    { key: 'treatment', label: t('services.category.treatment') },
    { key: 'other',     label: t('services.category.other')     },
  ]

  const grouped = CATEGORIES.map(c => ({
    cat: c.key, label: c.label,
    color: CATEGORY_COLORS[c.key],
    services: services.filter(s => s.category === c.key),
  })).filter(g => g.services.length > 0)

  const handleDelete = async () => {
    if (!confirmDelete) return
    await deleteSvc.mutateAsync(confirmDelete.id)
    setConfirmDelete(null)
  }

  return (
    <div>
      <PageHeader
        title={t('nav.services')}
        subtitle={t('services.activeCount', { active: services.filter(s => s.isActive).length, total: services.length })}
        actions={canManage
          ? <Button size="sm" onClick={() => setModalService('new')}><Plus className="w-4 h-4" />{t('services.newTitle')}</Button>
          : undefined
        }
      />

      {isLoading ? <Spinner /> : services.length === 0 ? (
        <Card><CardContent className="py-10">
          <EmptyState icon={Scissors} title={t('common.noResults')}
            description={t('services.newTitle')}
            action={canManage ? <Button size="sm" onClick={() => setModalService('new')}><Plus className="w-4 h-4" />{t('services.create')}</Button> : undefined}
          />
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ cat, label, color, services: catServices }) => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-3">
                <Badge className={cn(color, 'gap-1.5')}><Tag className="w-3 h-3" />{label}</Badge>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-body">{catServices.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catServices.map(svc => {
                  // Find assignment status for current location
                  const assignment = svc.assignedLocations?.find(a => a.locationId === currentLocId)
                  const isActiveInLoc = assignment?.isActive ?? svc.isActive

                  return (
                    <Card key={svc.id} className={cn('transition-all', !isActiveInLoc && 'opacity-55')}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-3 h-3 rounded-full flex-shrink-0 border-2"
                              style={{ backgroundColor: svc.color + '33', borderColor: svc.color }} />
                            <p className="font-display font-semibold text-sm text-foreground truncate">{svc.name}</p>
                          </div>
                          {currentLocId && (
                            <Badge className={cn('flex-shrink-0 text-[10px] border-0',
                              isActiveInLoc ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-400'
                            )}>
                              {isActiveInLoc ? t('common.active') : t('common.inactive')}
                            </Badge>
                          )}
                        </div>
                        {svc.description && (
                          <p className="text-xs text-muted-foreground font-body mb-3 line-clamp-2">{svc.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1.5 text-foreground font-display font-semibold">
                            <Euro className="w-3.5 h-3.5 text-muted-foreground" />{formatCurrency(assignment?.price ?? svc.basePrice)}
                          </span>
                          <span className="flex items-center gap-1.5 text-muted-foreground font-body text-xs">
                            <Clock className="w-3.5 h-3.5" />{getDurationLabel(svc.durationMinutes)}
                          </span>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                            <button onClick={() => setModalService(svc)}
                              className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-body text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                              <Edit2 className="w-3 h-3" />{t('common.edit')}
                            </button>
                            {currentLocId && (
                              <button onClick={() => handleToggleLocation(svc.id, currentLocId, isActiveInLoc)}
                                className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-body text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                {isActiveInLoc
                                  ? <><XCircle     className="w-3 h-3" />{t('services.deactivate')}</>
                                  : <><CheckCircle className="w-3 h-3" />{t('services.activate')}</>
                                }
                              </button>
                            )}
                            <button onClick={() => setConfirmDelete(svc)}
                              className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-body text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalService !== null && (
        <ServiceModal
          service={modalService === 'new' ? null : modalService}
          orgId={organization?.id ?? ''}
          onClose={() => setModalService(null)}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <h3 className="font-display font-bold text-foreground mb-2">{t('services.deleteTitle')}</h3>
            <p className="text-sm font-body text-muted-foreground mb-5"
              dangerouslySetInnerHTML={{ __html: t('services.deleteConfirm', { name: `<span class="text-foreground font-medium">${confirmDelete.name}</span>` }) }}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>{t('common.cancel')}</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>{t('common.delete')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}