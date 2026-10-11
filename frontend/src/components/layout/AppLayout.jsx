import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'
import { FlashProvider, useFlash } from '../../context/FlashContext'
import { AssistantProvider } from '../../context/AssistantContext'
import Toast from '../ui/Toast'
import PrescriptionModal from '../ui/PrescriptionModal'
import ErrorBoundary from '../ui/ErrorBoundary'
import AssistantDrawer from '../ai/AssistantDrawer'

function readCollapsed() {
  try { return localStorage.getItem('nc_sidebar') === 'collapsed' } catch { return false }
}

function AppLayoutContent() {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const { flash, clearFlash, prescriptionModal, closePrescriptionModal } = useFlash()
  const location = useLocation()

  // Close the mobile menu and clear the page filter on navigation
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMobileOpen(false)
    setGlobalSearch('')
  }

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 960px)').matches) {
      setMobileOpen(o => !o)
      return
    }
    setCollapsed(c => {
      try { localStorage.setItem('nc_sidebar', c ? 'expanded' : 'collapsed') } catch { /* ignore */ }
      return !c
    })
  }

  return (
    <div className={`app-shell${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}>
      <Sidebar collapsed={collapsed} />
      <div className="scrim scrim-nav" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      <div className="app-main">
        <TopHeader onToggleSidebar={toggleSidebar} search={globalSearch} onSearch={setGlobalSearch} />
        <main className="page" id="main">
          <ErrorBoundary key={location.pathname}>
            {/* Page chunks load here, keeping the sidebar and top bar on screen */}
            <Suspense fallback={<div className="page-loading"><div className="spinner" /></div>}>
              <Outlet context={{ globalSearch }} />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <AssistantDrawer />
      {flash && <Toast message={flash.message} type={flash.type} onDismiss={clearFlash} />}
      {prescriptionModal && (
        <PrescriptionModal
          src={prescriptionModal.src}
          alt={prescriptionModal.alt}
          onClose={closePrescriptionModal}
        />
      )}
    </div>
  )
}

export default function AppLayout() {
  return (
    <FlashProvider>
      <AssistantProvider>
        <AppLayoutContent />
      </AssistantProvider>
    </FlashProvider>
  )
}
