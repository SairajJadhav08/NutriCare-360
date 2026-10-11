import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useAssistant } from '../../context/AssistantContext'
import { useAiStatus } from '../../hooks/useAiStatus'
import RichText from './RichText'

const STORE_KEY = 'nc_assistant'
const STARTERS = [
  'What should I eat for dinner to hit my goal?',
  'How did my week of eating look?',
  'Am I on track with my medications today?',
  'Give me a 5-minute stretch for my desk breaks',
]

function loadHistory() {
  try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || [] } catch { return [] }
}

export default function AssistantDrawer() {
  const { isOpen, close, pending, takePending } = useAssistant()
  const { enabled, ready } = useAiStatus()
  const [messages, setMessages] = useState(loadHistory)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-30))) } catch { /* ignore */ }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    if (!isOpen) return
    inputRef.current?.focus()
    const onKey = e => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  // A prompt handed over from another screen gets sent straight away
  useEffect(() => {
    if (isOpen && pending && enabled && !sending) send(takePending())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pending, enabled])

  async function send(text) {
    const content = (text ?? input).trim()
    if (!content || sending) return
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setError(null)
    setSending(true)
    try {
      const res = await axios.post('/api/ai/chat', { messages: next })
      setMessages(m => [...m, { role: 'assistant', content: res.data.reply }])
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.')
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      <div className={`scrim${isOpen ? ' show' : ''}`} onClick={close} aria-hidden="true" />
      <aside className={`drawer${isOpen ? ' open' : ''}`} aria-label="Assistant" aria-hidden={!isOpen}>
        <header className="drawer-head">
          <div>
            <h2 className="drawer-title">Assistant</h2>
            <p className="drawer-sub">Answers use your own logs and reminders</p>
          </div>
          <div className="drawer-actions">
            {messages.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setMessages([]); setError(null) }}>
                Clear
              </button>
            )}
            <button className="btn btn-ghost btn-icon" onClick={close} aria-label="Close assistant">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </header>

        <div className="drawer-body" ref={scrollRef}>
          {ready && !enabled ? (
            <div className="ai-off">
              <i className="fa-solid fa-plug-circle-xmark" />
              <p>The assistant isn't set up on this server yet. Add <code>GROQ_API_KEY</code> to the backend <code>.env</code> to turn it on.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <p className="chat-empty-lead">Ask about your meals, medication routine or a stretch break. Try one of these:</p>
              <div className="starter-list">
                {STARTERS.map(s => (
                  <button key={s} className="starter" onClick={() => send(s)} disabled={!enabled}>
                    {s}<i className="fa-solid fa-arrow-right" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="chat">
              {messages.map((m, i) => (
                <li key={i} className={`msg msg-${m.role}`}>
                  {m.role === 'assistant' ? <RichText text={m.content} /> : <p>{m.content}</p>}
                </li>
              ))}
              {sending && (
                <li className="msg msg-assistant msg-typing" aria-label="Assistant is typing">
                  <span /><span /><span />
                </li>
              )}
            </ol>
          )}
          {error && <p className="inline-error"><i className="fa-solid fa-circle-exclamation" /> {error}</p>}
        </div>

        <footer className="drawer-foot">
          <div className="composer">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask anything about your health routine"
              disabled={!enabled}
              aria-label="Message"
            />
            <button className="btn btn-primary btn-icon" onClick={() => send()} disabled={!input.trim() || sending || !enabled} aria-label="Send">
              <i className="fa-solid fa-arrow-up" />
            </button>
          </div>
          <p className="fineprint">Not medical advice. Check with your doctor or pharmacist before changing a medication.</p>
        </footer>
      </aside>
    </>
  )
}
