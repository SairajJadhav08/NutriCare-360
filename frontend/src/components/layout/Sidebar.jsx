import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../ui/Logo'

const SECTIONS = [
  {
    // Untitled top group: a heading over a single item reads as noise
    items: [{ to: '/dashboard', icon: 'fa-house', label: 'Today' }],
  },
  {
    title: 'Track',
    items: [
      { to: '/nutrition', icon: 'fa-bowl-food', label: 'Nutrition' },
      { to: '/reminders', icon: 'fa-pills', label: 'Medications' },
      { to: '/yoga', icon: 'fa-spa', label: 'Yoga' },
    ],
  },
  {
    title: 'Records',
    items: [
      { to: '/prescriptions', icon: 'fa-file-medical', label: 'Prescriptions' },
      { to: '/profile', icon: 'fa-sliders', label: 'Profile & goals' },
    ],
  },
]

export default function Sidebar({ collapsed }) {
  const { user, logout } = useAuth()
  const initial = user?.username?.[0]?.toUpperCase() || 'U'

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <Link to="/dashboard" className="sidebar-brand" style={{ textDecoration: 'none' }}>
        <Logo />
      </Link>

      <nav className="sidebar-nav">
        {SECTIONS.map((section, i) => (
          <div className="nav-section" key={section.title || i}>
            {section.title && <span className="nav-section-title">{section.title}</span>}
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                <span className="nav-text">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-user">
          <Link to="/profile" className="sidebar-user-link" title={collapsed ? user?.username : undefined}>
            <span className="avatar" aria-hidden="true">{initial}</span>
            <span className="sidebar-user-text">
              <span className="sidebar-user-name">{user?.username}</span>
              <span className="sidebar-user-sub">View profile</span>
            </span>
          </Link>
          <button className="sidebar-logout" onClick={logout} aria-label="Log out" title="Log out">
            <i className="fa-solid fa-arrow-right-from-bracket" />
          </button>
        </div>
      </div>
    </aside>
  )
}
