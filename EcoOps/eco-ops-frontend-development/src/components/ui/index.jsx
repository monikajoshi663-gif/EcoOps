import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react'

export function Card({ className = '', children, ...props }) {
  return (
    <section className={`rounded-xl border border-line bg-surface ${className}`} {...props}>
      {children}
    </section>
  )
}

export function CardHeader({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

const BUTTON_VARIANTS = {
  primary: 'bg-primary text-primary-fg hover:bg-primary/90',
  secondary: 'border border-line bg-surface-2 text-fg hover:border-muted/60',
  ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
  danger: 'border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20',
}

export function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, disabled, ...props }) {
  const sizes = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm'
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizes} ${BUTTON_VARIANTS[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

const TONES = {
  neutral: 'border-line bg-surface-2 text-muted',
  green: 'border-primary/30 bg-primary/10 text-primary',
  blue: 'border-water/30 bg-water/10 text-water',
  amber: 'border-warn/30 bg-warn/10 text-warn',
  red: 'border-danger/30 bg-danger/10 text-danger',
}

export function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}

const PRIORITY_TONE = { high: 'red', medium: 'amber', low: 'neutral' }
export function PriorityBadge({ priority }) {
  return <Badge tone={PRIORITY_TONE[priority] ?? 'neutral'}>{priority ? `${priority[0].toUpperCase()}${priority.slice(1)} priority` : 'No priority'}</Badge>
}

const STATUS_TONE = { open: 'neutral', assigned: 'blue', in_progress: 'amber', resolved: 'green', pending: 'amber', approved: 'green', rejected: 'red' }
export function StatusBadge({ status }) {
  const label = String(status ?? 'unknown').replace(/_/g, ' ')
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'} className="capitalize">{label}</Badge>
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted" role="status">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}
    </div>
  )
}

export function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <Inbox className="size-6 text-muted" aria-hidden />
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="max-w-sm text-xs leading-relaxed text-muted">{description}</p>}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center" role="alert">
      <AlertTriangle className="size-6 text-danger" aria-hidden />
      <div>
        <p className="text-sm font-medium text-fg">Couldn&apos;t load data</p>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">{error?.message ?? 'Unknown error'}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={() => onRetry()}>
          <RefreshCw className="size-3.5" aria-hidden />
          Retry
        </Button>
      )}
    </div>
  )
}

// Renders loading / error / empty / content for an SWR result.
export function AsyncBoundary({ swr, isEmpty, empty, loadingLabel, children }) {
  if (swr.error && !swr.data) return <ErrorState error={swr.error} onRetry={swr.mutate} />
  if (!swr.data) return <LoadingState label={loadingLabel} />
  if (isEmpty?.(swr.data)) return empty
  return children(swr.data)
}

export function PageHeader({ title, description, actions }) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-pretty text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Field({ label, htmlFor, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-fg">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

export const inputClass =
  'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/70 focus:border-primary focus:outline-none'
