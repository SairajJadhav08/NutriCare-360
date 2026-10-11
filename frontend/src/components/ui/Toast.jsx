import { useEffect } from 'react'

const ICONS = {
  success: 'fa-circle-check',
  error: 'fa-circle-exclamation',
}

export default function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className={`toast toast-${type || 'info'}`} role="alert" aria-live="polite">
      <i className={`fa-solid ${ICONS[type] || 'fa-circle-info'}`} aria-hidden="true" />
      <span>{message}</span>
      <button onClick={onDismiss} className="toast-close" aria-label="Dismiss notification">
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  )
}
