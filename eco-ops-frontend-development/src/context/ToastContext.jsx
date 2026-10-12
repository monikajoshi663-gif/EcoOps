import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertTriangle, X } from 'lucide-react'

const ToastContext = createContext(null)
let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback(
    (kind, message) => {
      const id = ++toastId
      setToasts((t) => [...t, { id, kind, message }])
      setTimeout(() => dismiss(id), 5000)
    },
    [dismiss],
  )

  const toast = { success: (m) => push('success', m), error: (m) => push('error', m) }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border bg-surface-2 p-3 text-sm shadow-lg ${
              t.kind === 'error' ? 'border-danger/40' : 'border-primary/40'
            }`}
          >
            {t.kind === 'error' ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            )}
            <p className="flex-1 text-pretty leading-relaxed">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-muted hover:text-fg" aria-label="Dismiss notification">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
