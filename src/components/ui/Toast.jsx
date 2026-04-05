import { useEffect } from 'react'

const BG_COLORS = {
  success: 'var(--success)',
  error: 'var(--danger)',
}

export default function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const backgroundColor = BG_COLORS[type] ?? 'var(--primary)'

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium"
      style={{ backgroundColor }}
      role="alert"
      aria-live="polite"
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 opacity-80 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  )
}
