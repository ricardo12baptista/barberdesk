import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Scissors, Clock, Euro, Edit2, Trash2, CheckCircle, XCircle, Tag } from 'lucide-react'
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks'
import { useAuthStore } from '@/stores/auth.store'
import { PageHeader, Card, CardContent, Badge, Button, Spinner, EmptyState, Input } from '@/components/ui'
import { formatCurrency, getDurationLabel, cn } from '@/lib/utils'
import type { Service } from '@/models'

const CATEGORY_COLORS: Record<Service['category'], string> = {
  hair:      'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  beard:     'bg-amber-500/15  text-amber-400  border-amber-500/30',
  combo:     'bg-green-500/15  text-green-400  border-green-500/30',
  treatment: 'bg-sky-500/15    text-sky-400    border-sky-500/30',
  other:     'bg-slate-500/15  text-slate-400  border-slate-500/30',
}

function ServiceModal({ service, orgId, onClose }: { service: Service | null; orgId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const isEdit    = !!service
  const createSvc = useCreateService()
  const updateSvc = useUpdateService()

  const CATEGORIES: { key: Service['category']; label: string }[] = [
    { key: 'hair',      label: t('services.category.hair')      },
    { key: 'beard',     label: t('services.category.beard')     },
    { key: 'combo',     label: t('services.category.combo')     },
    { key: 'treatment', label: t('services.category.treatment') },
    { key: 'other',     label: t('services.category.other')     },
  ]

  const [form, setForm] = useState({
    name:            service?.name            ?? '',
    category:        service?.category        ?? ('hair' as Service['category']),
    durationMinutes: service?.durationMinutes ?? 30,
    basePrice:       service?.basePrice       ?? 15,
    description:     service?.description     ?? '',
    isActive:        service?.isActive        ?? true,
    color:           service?.color           ?? '#6366f1',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError(t('services.name') + ' ' + t('common.save').toLowerCase() + '.'); return }
    setSaving(true)
    try {
      if (isEdit) await updateSvc.mutateAsync({ id: service.id, data: form })
      else        await createSvc.mutateAsync({ ...form, organizationId: orgId })
      onClose()
    } catch { setError('Erro ao guardar. Tenta novamente.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-bold text-foreground text-base">
            {isEdit ? t('services.editTitle') : t('services.newTitle')}
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
          {isEdit && (
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-body text-foreground">{t('services.active')}</span>
              <button onClick={() => set('isActive', !form.isActive)}
                className={cn('w-10 h-6 rounded-full transition-colors relative overflow-hidden', form.isActive ? 'bg-primary' : 'bg-muted')}
              >
                <span className={cn('absolute top-[4px] w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                  form.isActive ? 'left-[22px]' : 'left-[4px]')} />
              </button>
            </div>
          )}
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
  const { data: services = [], isLoading } = useServices()
  const updateSvc = useUpdateService()
  const deleteSvc = useDeleteService()

  const [modalService,  setModalService]  = useState<Service | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null)
  const canManage = user?.role === 'super_admin' || user?.role === 'manager'

  const CATEGORIES: { key: Service['category']; label: string }[] = [
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

  const handleToggle = (svc: Service) => updateSvc.mutate({ id: svc.id, data: { isActive: !svc.isActive } })
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
                {catServices.map(svc => (
                  <Card key={svc.id} className={cn('transition-all', !svc.isActive && 'opacity-55')}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-3 h-3 rounded-full flex-shrink-0 border-2"
                            style={{ backgroundColor: svc.color + '33', borderColor: svc.color }} />
                          <p className="font-display font-semibold text-sm text-foreground truncate">{svc.name}</p>
                        </div>
                        <Badge className={cn('flex-shrink-0 text-[10px] border-0',
                          svc.isActive ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-400'
                        )}>
                          {svc.isActive ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </div>
                      {svc.description && (
                        <p className="text-xs text-muted-foreground font-body mb-3 line-clamp-2">{svc.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-foreground font-display font-semibold">
                          <Euro className="w-3.5 h-3.5 text-muted-foreground" />{formatCurrency(svc.basePrice)}
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
                          <button onClick={() => handleToggle(svc)}
                            className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-body text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            {svc.isActive
                              ? <><XCircle     className="w-3 h-3" />{t('services.deactivate')}</>
                              : <><CheckCircle className="w-3 h-3" />{t('services.activate')}</>
                            }
                          </button>
                          <button onClick={() => setConfirmDelete(svc)}
                            className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-body text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalService !== null && (
        <ServiceModal service={modalService === 'new' ? null : modalService} orgId={organization?.id ?? ''} onClose={() => setModalService(null)} />
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
