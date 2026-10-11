import { useState } from 'react'

/**
 * Empty list placeholder. `image` is a small generated still-life (public/images/empty-*-240.webp);
 * if it fails to load the icon is shown instead.
 */
export default function EmptyState({ image, icon, title, children, action }) {
  const [imgOk, setImgOk] = useState(Boolean(image))
  return (
    <div className="empty">
      {imgOk
        ? <img src={image} alt="" width={112} height={112} loading="lazy" decoding="async" className="empty-img" onError={() => setImgOk(false)} />
        : <div className="empty-icon" aria-hidden="true"><i className={`fa-solid ${icon}`} /></div>}
      <p className="empty-title">{title}</p>
      {children && <p className="empty-text">{children}</p>}
      {action}
    </div>
  )
}
