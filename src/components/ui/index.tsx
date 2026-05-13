import { forwardRef, ButtonHTMLAttributes, SelectHTMLAttributes, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-muted text-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-border text-foreground hover:bg-muted',
    }
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-sm',
      lg: 'h-11 px-6 text-sm',
      icon: 'h-9 w-9',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-body font-medium',
          'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline'
}
export function Badge({ className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium font-body border',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card text-card-foreground', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pb-0', className)} {...props}>{children}</div>
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props}>{children}</div>
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold font-display text-muted-foreground uppercase tracking-wider', className)} {...props}>
      {children}
    </h3>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
}
export function Select({ className, options, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm font-body',
        'text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
        'cursor-pointer',
        className
      )}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium font-body text-foreground">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm font-body',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            leftIcon && 'pl-9',
            error && 'border-destructive focus:ring-destructive',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-destructive font-body">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ─── PageHeader ───────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string | React.ReactNode
  actions?: React.ReactNode
}
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5 font-body">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-sm font-semibold font-display text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground font-body max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <svg className="w-6 h-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
export function Avatar({ name = '', src, size = 'md', className }: AvatarProps) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }
  const initials = (name || '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (
    <div className={cn('rounded-full bg-primary/20 flex items-center justify-center font-display font-semibold text-primary flex-shrink-0', sizes[size], className)}>
      {src ? <img src={src} alt={name} className="w-full h-full rounded-full object-cover" /> : initials}
    </div>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ElementType
  trend?: { value: number; label: string }
  iconColor?: string
}
export function MetricCard({ title, value, subtitle, icon: Icon, trend, iconColor = 'text-primary' }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1 font-body">{subtitle}</p>}
            {trend && (
              <p className={cn('text-xs font-medium mt-1 font-body', trend.value >= 0 ? 'text-green-500' : 'text-red-400')}>
                {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className={cn('w-5 h-5', iconColor)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
