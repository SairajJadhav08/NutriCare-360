import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

const routeNames = {
  '/dashboard': 'Dashboard',
  '/reminders': 'Reminders',
  '/prescriptions': 'Prescriptions',
  '/nutrition': 'Nutrition',
  '/yoga': 'Yoga',
  '/profile': 'Profile',
}

export default function TopHeader({ onToggleSidebar, onSearch }) {
  const { theme, toggle } = useTheme()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const pageName = routeNames[location.pathname] || 'Dashboard'

  return (
    <header className="top-header">
      <div className="header-left">
        <button className="sidebar-toggle" id="sidebarToggle" onClick={onToggleSidebar}>
          <i className="fas fa-bars"></i>
        </button>
        <div className="page-breadcrumb">
          <i className="fas fa-home"></i>
          <span>/</span>
          <span className="current">{pageName}</span>
        </div>
      </div>
      <div className="header-right">
        <div className="header-search">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search anything..." 
            onChange={(e) => onSearch && onSearch(e.target.value)} 
          />
        </div>
        <div className="header-actions">
          <button className="header-btn" onClick={toggle} aria-label="Toggle theme">
            <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'}></i>
          </button>
          <button className="header-btn" onClick={() => navigate('/reminders')} title="Notifications">
            <i className="fas fa-bell"></i>
          </button>
          <button className="header-btn" onClick={() => navigate('/profile')} title="Settings">
            <i className="fas fa-cog"></i>
          </button>
        </div>
        <div className="user-menu">
          <div className="user-menu-avatar">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="user-menu-info">
            <span className="user-menu-name">{user?.username}</span>
            <span className="user-menu-role">User</span>
          </div>
          <i className="fas fa-chevron-down" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}></i>
        </div>
      </div>
    </header>
  )
}
