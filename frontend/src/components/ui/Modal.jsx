import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ title, onClose, children, footer, width = 480 }) {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Rendered at <body> so no ancestor's transform/overflow can affect fixed positioning
  return createPortal(
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: `${width / 16}rem` }}>
        <header className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body
  )
}
