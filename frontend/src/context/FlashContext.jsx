import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const FlashContext = createContext(null)

export function FlashProvider({ children }) {
  const [flash, setFlash] = useState(null)
  const [prescriptionModal, setPrescriptionModal] = useState(null)

  // Stable identities so pages can list these as effect dependencies safely
  const showFlash = useCallback((message, type = 'info') => setFlash({ message, type }), [])
  const clearFlash = useCallback(() => setFlash(null), [])
  const openPrescriptionModal = useCallback((src, alt) => setPrescriptionModal({ src, alt }), [])
  const closePrescriptionModal = useCallback(() => setPrescriptionModal(null), [])

  const value = useMemo(() => ({
    flash, showFlash, clearFlash, prescriptionModal, openPrescriptionModal, closePrescriptionModal,
  }), [flash, showFlash, clearFlash, prescriptionModal, openPrescriptionModal, closePrescriptionModal])

  return <FlashContext.Provider value={value}>{children}</FlashContext.Provider>
}

export const useFlash = () => useContext(FlashContext)
