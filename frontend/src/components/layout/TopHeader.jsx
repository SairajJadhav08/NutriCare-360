import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useAssistant } from '../../context/AssistantContext'

// Pages whose lists the header search filters, and what it searches
const SEARCHABLE = {
  '/nutrition': 'Filter food log',
  '/reminders': 'Filter medications',
  '/prescriptions': 'Filter documents',
  '/yoga': 'Filter poses',
}

export default function TopHeader({ onToggleSidebar, search, onSearch }) {
  const { theme, toggle } = useTheme()
  const { user, logout } = useAuth()
  const { open: openAssistant } = useAssistant()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const placeholder = SEARCHABLE[location.pathname]

  useEffect(() => {
    if (!menuOpen) return
    const onDown = e => !menuRef.current?.contains(e.target) && setMenuOpen(false)
    const onKey = e => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [menuOpen])

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="btn btn-ghost btn-icon" onClick={onToggleSidebar} aria-label="Toggle navigation">
          <i className="fa-solid fa-bars" />
        </button>
        {placeholder && (
          <label className="topbar-search">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              type="search"
              value={search}
              placeholder={placeholder}
              onChange={e => onSearch(e.target.value)}
              aria-label={placeholder}
            />
          </label>
        )}
      </div>

      <div className="topbar-right">
        <button className="btn btn-secondary btn-sm assistant-btn" onClick={() => openAssistant()}>
          <i className="fa-regular fa-comment-dots" />
          <span>Ask assistant</span>
        </button>
        <button className="btn btn-ghost btn-icon" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          <i className={theme === 'dark' ? 'fa-regular fa-sun' : 'fa-regular fa-moon'} />
        </button>
        <div className="menu" ref={menuRef}>
          <button className="avatar-btn" onClick={() => setMenuOpen(o => !o)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Account menu">
            <span className="avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
          </button>
          {menuOpen && (
            <div className="menu-pop" role="menu">
              <div className="menu-user">
                <span className="menu-user-name">{user?.username}</span>
                <span className="muted small">Signed in</span>
              </div>
              <Link to="/profile" className="menu-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                <i className="fa-regular fa-user" /> Profile & goals
              </Link>
              <button className="menu-item" role="menuitem" onClick={logout}>
                <i className="fa-solid fa-arrow-right-from-bracket" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
