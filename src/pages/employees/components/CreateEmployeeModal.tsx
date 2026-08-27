import { ReactNode, useEffect, useState } from 'react'
import { X, User, Mail, Lock, Phone, Percent, Scissors } from 'lucide-react'
import { useCreateEmployee, useServices } from '@/hooks'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Employee } from '@/models'

interface Props {
  open:       boolean
  onClose:    () => void
  employee?:  Employee | null
  locationId: string
}

export function CreateEmployeeModal({ open, onClose, employee, locationId }: Props) {
  const isEdit = !!employee
  const { user } = useAuthStore()
  const createEmployee = useCreateEmployee()
  const { data: services = [] } = useServices()

  const [form, setForm] = useState({
    name:              '',
    email:             '',
    phone:             '',
    password:          '',
    commissionPercent: 40,
    serviceIds:        [] as string[],
    isActive:          true,
  })
  const [registerSelf, setRegisterSelf] = useState(false)
  useEffect(() => {
    if (!open) return
    if (employee) {
      setForm({
        name:              employee.name,
        email:             '',
        phone:             '',
        password:          '',
        commissionPercent: employee.commissionPercent,
        serviceIds:        employee.serviceIds ?? [],
        isActive:          employee.isActive,
      })
    } else {
      setForm({ name: '', email: '', phone: '', password: '', commissionPercent: 40, serviceIds: [], isActive: true })
      setRegisterSelf(false)
    }
  }, [open, employee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Decompose name into firstName and lastName
    const nameParts = form.name.trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    await createEmployee.mutateAsync({
      firstName,
      lastName,
      email:             form.email,
      phone:             form.phone,
      password:          registerSelf ? undefined : form.password,
      userId:            registerSelf ? user?.id : undefined,
      locationId,
      commissionPercent: form.commissionPercent,
      serviceIds:        form.serviceIds,
      isActive:          form.isActive,
      // userId will be created server-side when backend creates the user account
    })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">
              {isEdit ? 'Editar Barbeiro' : 'Adicionar Barbeiro'}
            </h2>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              {isEdit ? 'Atualiza os dados do barbeiro' : 'Cria uma conta de acesso para o novo barbeiro'}
            </p>
            {!isEdit && user?.role === 'owner' && (
              <button type="button" onClick={() => { setRegisterSelf(v => !v); setForm(f => ({ ...f, name: !registerSelf ? user.name : '', email: !registerSelf ? user.email : '' })) }} className="mt-2 text-xs font-medium text-primary hover:underline">
                {registerSelf ? 'Registar outra pessoa' : 'Sou eu, adicionar-me como barbeiro'}
              </button>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin">

            {/* Name */}
            <Field label="Nome completo" icon={User} required>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Tiago Costa"
                className={inputCls}
              />
            </Field>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" icon={Mail} required={!isEdit}>
                <input
                  type="email"
                  required={!isEdit && !registerSelf}
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tiago@barbershop.pt"
                  className={inputCls}
                />
              </Field>
              <Field label="Telefone" icon={Phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+351 9XX XXX XXX"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Password — only on create */}
            {!isEdit && (
              <Field label="Palavra-passe de acesso" icon={Lock} required>
                <input
                  type="password"
                  required={!registerSelf}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  className={inputCls}
                />
              </Field>
            )}

            {/* Commission */}
            <Field label={`Comissão: ${form.commissionPercent}%`} icon={Percent}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.commissionPercent}
                  onChange={e => setForm(f => ({ ...f, commissionPercent: Number(e.target.value) }))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-mono font-semibold text-primary w-10 text-right">
                  {form.commissionPercent}%
                </span>
              </div>
            </Field>

            {/* Services this employee performs */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium font-body text-foreground">
                <Scissors className="w-3.5 h-3.5 text-muted-foreground" />
                Serviços realizados
                {form.serviceIds.length > 0 && (
                  <span className="ml-auto text-xs text-primary font-body">{form.serviceIds.length} seleccionado{form.serviceIds.length !== 1 ? 's' : ''}</span>
                )}
              </label>
              {services.length === 0 ? (
                <p className="text-xs text-muted-foreground font-body py-2">Nenhum serviço parametrizado.</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {services.map(svc => {
                    const checked = form.serviceIds.includes(svc.id)
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          serviceIds: checked
                            ? f.serviceIds.filter(id => id !== svc.id)
                            : [...f.serviceIds, svc.id],
                        }))}
                        className={cn(
                          'flex items-center gap-2 h-9 px-3 rounded-lg border text-left text-xs font-body transition-all',
                          checked
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/40'
                        )}
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: svc.color }} />
                        <span className="truncate">{svc.name}</span>
                        {checked && <span className="ml-auto text-primary flex-shrink-0">✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-sm font-medium font-body text-foreground">Conta ativa</p>
                <p className="text-xs text-muted-foreground font-body">O barbeiro consegue fazer login</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  form.isActive ? 'bg-primary' : 'bg-muted'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                  form.isActive ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={createEmployee.isPending}>
              {isEdit ? 'Guardar alterações' : 'Criar conta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls = 'w-full h-9 rounded-lg border border-input bg-muted/30 px-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors'

function Field({ label, icon: Icon, required, children }: {
  label: string; icon: React.ElementType; required?: boolean; children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium font-body text-foreground">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  )
}
