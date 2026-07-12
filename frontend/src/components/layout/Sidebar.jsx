import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar({ collapsed }) {
  const { user, logout } = useAuth()

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} id="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <i className="fas fa-heartbeat"></i>
        </div>
        <div className="brand-text">
          <span className="brand-name">NutriCare-360</span>
          <span className="brand-tagline">Health &amp; Wellness</span>
        </div>
      </div>

      <div className="sidebar-user-card">
        <div className="sidebar-user-avatar">
          <i className="fas fa-user" style={{ color: 'white', fontSize: '1.25rem' }}></i>
        </div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user?.username}</span>
          <span className="sidebar-user-status">
            <span className="status-dot"></span>
            Online
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-title">Main Menu</span>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <div className="icon"><i className="fas fa-th-large"></i></div>
            <span className="nav-text">Dashboard</span>
          </NavLink>
          <NavLink to="/reminders" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <div className="icon"><i className="fas fa-bell"></i></div>
            <span className="nav-text">Reminders</span>
          </NavLink>
          <NavLink to="/prescriptions" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <div className="icon"><i className="fas fa-file-prescription"></i></div>
            <span className="nav-text">Prescriptions</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <span className="nav-section-title">Wellness</span>
          <NavLink to="/nutrition" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <div className="icon"><i className="fas fa-apple-alt"></i></div>
            <span className="nav-text">Nutrition</span>
          </NavLink>
          <NavLink to="/yoga" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <div className="icon"><i className="fas fa-spa"></i></div>
            <span className="nav-text">Yoga</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <span className="nav-section-title">Account</span>
          <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <div className="icon"><i className="fas fa-user-circle"></i></div>
            <span className="nav-text">Profile</span>
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="interface-badge">
          <i className="fas fa-sparkles"></i>
          <span>New Experience v3.0</span>
        </div>
        <button onClick={logout} className="nav-item logout" style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', font: 'inherit' }}>
          <div className="icon"><i className="fas fa-sign-out-alt"></i></div>
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </aside>
  )
}
