import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, UserPlus, Phone, Star, ChevronLeft, ChevronRight, MoreVertical, Ban, Trash2, ShieldOff } from 'lucide-react'
import { useClients, useUpdateClient, useDeleteClient } from '@/hooks'
import { useAuthStore } from '@/stores/auth.store'
import { PageHeader, Button, Badge, Avatar, Card, CardContent, Input, Spinner, EmptyState } from '@/components/ui'
import { tagColors, formatDate, cn } from '@/lib/utils'
import type { Client, ClientTag } from '@/models'

const PAGE_SIZE = 15

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({
  title, description, confirmLabel, confirmVariant = 'destructive', onConfirm, onClose,
}: {
  title: string; description: string; confirmLabel: string
  confirmVariant?: 'destructive' | 'warning'; onConfirm: () => void; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
        <h3 className="font-display font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm font-body text-muted-foreground mb-5">{description}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button
            variant={confirmVariant === 'destructive' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => { onConfirm(); onClose() }}
            className={confirmVariant === 'warning' ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Row action menu ──────────────────────────────────────────────────────────
function ClientActions({ client, onBlock, onDelete }: {
  client: Client
  onBlock: (client: Client) => void
  onDelete: (client: Client) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const isBlocked = client.tags.includes('blacklisted')

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-border bg-card shadow-xl py-1.5 animate-fade-in">
            <button
              onClick={() => { setOpen(false); onBlock(client) }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-body transition-colors',
                isBlocked
                  ? 'text-foreground hover:bg-muted'
                  : 'text-amber-400 hover:bg-amber-500/10'
              )}
            >
              {isBlocked
                ? <><ShieldOff className="w-3.5 h-3.5" />Desbloquear</>
                : <><Ban        className="w-3.5 h-3.5" />{t('clients.tags.blacklisted')}</>
              }
            </button>
            <div className="my-1 border-t border-border" />
            <button
              onClick={() => { setOpen(false); onDelete(client) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-body text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('common.delete')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ClientsPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const canManage = user?.role === 'super_admin' || user?.role === 'manager'

  const [search,      setSearch]      = useState('')
  const [draftSearch, setDraftSearch] = useState('')
  const [page,        setPage]        = useState(1)

  const [confirmBlock,  setConfirmBlock]  = useState<Client | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null)

  const { data: result, isLoading, isFetching } = useClients(search || undefined, page, PAGE_SIZE)
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const isPaginated = !!result && !Array.isArray(result)
  const clients     = (Array.isArray(result) ? result : result?.data ?? []) as Client[]
  const total       = isPaginated ? result.total : clients.length
  const totalPages  = isPaginated ? result.totalPages : 1

  const handleSearch = useCallback((value: string) => {
    setDraftSearch(value)
    setPage(1)
    setSearch(value)
  }, [])

  const handleBlock = async (client: Client) => {
    const isBlocked = client.tags.includes('blacklisted')
    const newTags = isBlocked
      ? client.tags.filter(t => t !== 'blacklisted')
      : [...client.tags.filter(t => t !== 'blacklisted'), 'blacklisted']
    await updateClient.mutateAsync({ id: client.id, data: { tags: newTags as ClientTag[] } })
  }

  const handleDelete = async (client: Client) => {
    await deleteClient.mutateAsync(client.id)
    // If last item on page, go back one page
    if (clients.length === 1 && page > 1) setPage(p => p - 1)
  }

  return (
    <div>
      <PageHeader
        title={t('clients.title')}
        subtitle={`${total} ${t('clients.title').toLowerCase()} registados`}
        actions={
          canManage ? (
            <Button>
              <UserPlus className="w-4 h-4" />
              {t('clients.new')}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4">
        <Input
          placeholder={`${t('common.search')} por nome, telefone ou email...`}
          value={draftSearch}
          onChange={e => handleSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Spinner />
          ) : clients.length === 0 ? (
            <EmptyState icon={UserPlus} title="Nenhum cliente encontrado" description="Adiciona o primeiro cliente ou ajusta a pesquisa." />
          ) : (
            <>
              <div className={cn('divide-y divide-border', isFetching && 'opacity-60 transition-opacity')}>
                {clients.map((client: Client) => {
                  const isBlocked = client.tags.includes('blacklisted')
                  return (
                    <div key={client.id} className={cn(
                      'flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors',
                      isBlocked && 'opacity-50'
                    )}>
                      <Avatar name={client.name} size="md" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium font-body text-foreground">{client.name}</p>
                          {client.tags.map((tag) => (
                            <Badge key={tag} className={cn(tagColors[tag], 'border-0')}>
                              {t(`clients.tags.${tag}`)}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground font-body flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {client.phone}
                          </span>
                          <span className="text-xs text-muted-foreground font-body">
                            Desde {formatDate(client.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-1 justify-end text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-mono font-medium">{client.loyaltyPoints} pts</span>
                          </div>
                        </div>

                        {canManage && (
                          <ClientActions
                            client={client}
                            onBlock={setConfirmBlock}
                            onDelete={setConfirmDelete}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                  <span className="text-xs text-muted-foreground font-body">
                    {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const startPage = Math.max(1, Math.min(page - 2, totalPages - 4))
                      const p = startPage + i
                      return (
                        <button key={p} onClick={() => setPage(p)}
                          className={cn('w-7 h-7 rounded-lg text-xs font-body font-medium transition-all',
                            p === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >{p}</button>
                      )
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Block confirm */}
      {confirmBlock && (
        <ConfirmModal
          title={confirmBlock.tags.includes('blacklisted') ? 'Desbloquear cliente?' : 'Bloquear cliente?'}
          description={
            confirmBlock.tags.includes('blacklisted')
              ? `"${confirmBlock.name}" voltará a poder marcar consultas.`
              : `"${confirmBlock.name}" ficará marcado como bloqueado e não poderá fazer novas marcações.`
          }
          confirmLabel={confirmBlock.tags.includes('blacklisted') ? 'Desbloquear' : 'Bloquear'}
          confirmVariant={confirmBlock.tags.includes('blacklisted') ? 'warning' : 'warning'}
          onConfirm={() => handleBlock(confirmBlock)}
          onClose={() => setConfirmBlock(null)}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <ConfirmModal
          title="Eliminar cliente?"
          description={`Tens a certeza que queres eliminar "${confirmDelete.name}"? Esta acção não pode ser desfeita e todas as marcações associadas perderão a referência ao cliente.`}
          confirmLabel={t('common.delete')}
          confirmVariant="destructive"
          onConfirm={() => handleDelete(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
