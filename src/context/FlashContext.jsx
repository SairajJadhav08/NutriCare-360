import { createContext, useContext, useState } from 'react'

const FlashContext = createContext(null)

export function FlashProvider({ children }) {
  const [flash, setFlash] = useState(null)
  const [prescriptionModal, setPrescriptionModal] = useState(null)

  const showFlash = (message, type = 'info') => {
    setFlash({ message, type })
  }

  const clearFlash = () => {
    setFlash(null)
  }

  const openPrescriptionModal = (src, alt) => {
    setPrescriptionModal({ src, alt })
  }

  const closePrescriptionModal = () => {
    setPrescriptionModal(null)
  }

  return (
    <FlashContext.Provider value={{
      flash,
      showFlash,
      clearFlash,
      prescriptionModal,
      openPrescriptionModal,
      closePrescriptionModal,
    }}>
      {children}
    </FlashContext.Provider>
  )
}

export const useFlash = () => useContext(FlashContext)
