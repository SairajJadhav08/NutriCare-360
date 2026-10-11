import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import RoutineBuilder from '../components/ai/RoutineBuilder'
import PoseImage from '../components/ui/PoseImage'
import PoseDetail from '../components/yoga/PoseDetail'

const KG_FOR_CARDS = 70 // cards show a reference estimate; the detail view uses the user's weight

export default function Yoga() {
  const { globalSearch = '' } = useOutletContext() || {}
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [poses, setPoses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState('All')
  const openedHere = useRef(false) // true when this page pushed the ?pose= history entry

  useEffect(() => {
    axios.get('/api/yoga/poses')
      .then(r => setPoses(r.data.poses || []))
      .catch(err => setError(err.response?.data?.error || 'Could not load poses'))
      .finally(() => setLoading(false))
  }, [])

  const categories = ['All', ...[...new Set(poses.map(p => p.category))].sort()]
  const q = globalSearch.toLowerCase()
  const visible = poses
    .filter(p => category === 'All' || p.category === category)
    .filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))

  // The open pose lives in the URL (?pose=slug): shareable, and Back closes it
  const selectedSlug = params.get('pose')
  const selected = poses.find(p => p.slug === selectedSlug)
  const list = visible.some(p => p.slug === selectedSlug) ? visible : poses
  const idx = list.findIndex(p => p.slug === selectedSlug)

  const openPose = (slug) => { openedHere.current = true; setParams({ pose: slug }) }
  const switchPose = useCallback((slug) => setParams({ pose: slug }, { replace: true }), [setParams])
  const closePose = useCallback(() => {
    if (openedHere.current) { openedHere.current = false; navigate(-1) }
    else setParams({}, { replace: true })
  }, [navigate, setParams])

  return (
    <div className="stack-lg animate-in">
      <header className="page-head">
        <div>
          <h1 className="page-title">Yoga</h1>
          <p className="page-sub">Build a timed routine for what you need today, or open any pose for a full guide.</p>
        </div>
      </header>

      <RoutineBuilder />

      <section className="stack-md">
        <div className="section-head">
          <h2 className="section-title">Pose library <span className="muted">{visible.length}</span></h2>
          <div className="chip-row" role="radiogroup" aria-label="Category">
            {categories.map(c => (
              <button key={c} role="radio" aria-checked={category === c}
                className={`chip${category === c ? ' is-on' : ''}`} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="callout callout-danger">{error}</p>
        ) : loading ? (
          <div className="pose-grid">{[...Array(6)].map((_, i) => <div key={i} className="skeleton block" style={{ height: '16.25rem' }} />)}</div>
        ) : (
          <ul className="pose-grid">
            {visible.map(p => (
              <li key={p.slug}>
                <button className="pose" onClick={() => openPose(p.slug)} aria-label={`Open ${p.name}`}>
                  <span className="pose-media">
                    <PoseImage name={p.name} fallback={p.image_url} className="pose-img" sizes="(max-width: 720px) calc(100vw - 2rem), 300px" />
                    <span className="badge badge-overlay">{p.category}</span>
                  </span>
                  <span className="pose-body">
                    <span className="pose-name">{p.name}</span>
                    <span className="pose-desc">{p.description}</span>
                    <span className="pose-meta">
                      {p.level && <span className={`pose-level level-${p.level.toLowerCase()}`}>{p.level}</span>}
                      {p.met && <span>≈ {Math.round(p.met * 3.5 * KG_FOR_CARDS / 200 * 10)} kcal / 10 min</span>}
                      <span className="pose-open">Details <i className="fa-solid fa-arrow-right" /></span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected && (
        <PoseDetail
          pose={selected}
          onClose={closePose}
          onPrev={idx > 0 ? () => switchPose(list[idx - 1].slug) : null}
          onNext={idx >= 0 && idx < list.length - 1 ? () => switchPose(list[idx + 1].slug) : null}
          onSelect={(name) => { const t = poses.find(p => p.name === name); if (t) switchPose(t.slug) }}
        />
      )}
    </div>
  )
}
