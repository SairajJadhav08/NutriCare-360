import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'
import { FlashProvider, useFlash } from '../../context/FlashContext'
import Toast from '../ui/Toast'
import PrescriptionModal from '../ui/PrescriptionModal'
import ErrorBoundary from '../ui/ErrorBoundary'

function AppLayoutContent() {
  const [collapsed, setCollapsed] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const { flash, clearFlash, prescriptionModal, closePrescriptionModal } = useFlash()

  const toggleSidebar = () => setCollapsed(prev => !prev)

  return (
    <div className="app-wrapper">
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <TopHeader onToggleSidebar={toggleSidebar} onSearch={setGlobalSearch} />
      <main className="main-content">
        {flash && flash.message && (
          <div
            className="flash-banner"
            style={{
              backgroundColor: flash.type === 'error' ? 'var(--danger)' : flash.type === 'success' ? 'var(--success)' : 'var(--primary)',
              color: 'white',
              padding: '1rem',
              marginBottom: '1rem',
              borderRadius: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            role="alert"
          >
            <span>{flash.message}</span>
            <button
              onClick={clearFlash}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0 0.5rem',
                lineHeight: '1'
              }}
              aria-label="Dismiss flash message"
            >
              &times;
            </button>
          </div>
        )}
        <ErrorBoundary>
          <Outlet context={{ globalSearch }} />
        </ErrorBoundary>
      </main>
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
      <AppLayoutContent />
    </FlashProvider>
  )
}
