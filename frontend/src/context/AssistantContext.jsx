import { createContext, useCallback, useContext, useState } from 'react'

const AssistantContext = createContext(null)

export function AssistantProvider({ children }) {
  const [isOpen, setOpen] = useState(false)
  // A prompt handed over from elsewhere in the app (e.g. "Ask about this" on the daily brief)
  const [pending, setPending] = useState(null)

  const open = useCallback((prompt) => {
    if (typeof prompt === 'string') setPending(prompt)
    setOpen(true)
  }, [])
  const close = useCallback(() => setOpen(false), [])
  const takePending = useCallback(() => {
    const p = pending
    setPending(null)
    return p
  }, [pending])

  return (
    <AssistantContext.Provider value={{ isOpen, open, close, pending, takePending }}>
      {children}
    </AssistantContext.Provider>
  )
}

export const useAssistant = () => useContext(AssistantContext)
