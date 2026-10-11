import { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import axios from 'axios'
import { useFlash } from '../context/FlashContext'
import { parseUtc } from '../lib/format'
import EmptyState from '../components/ui/EmptyState'

const ACCEPT = 'image/*,.pdf'
const isPdf = name => /\.pdf$/i.test(name)

export default function Prescriptions() {
  const { showFlash, openPrescriptionModal } = useFlash()
  const { globalSearch = '' } = useOutletContext() || {}
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const fetchItems = useCallback(async () => {
    try {
      const r = await axios.get('/api/prescriptions')
      setItems(r.data.prescriptions)
    } catch {
      showFlash('Could not load prescriptions', 'error')
    } finally {
      setLoading(false)
    }
  }, [showFlash])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function upload(files) {
    const list = [...files]
    if (!list.length) return
    setUploading(true)
    let ok = 0
    for (const file of list) {
      const fd = new FormData()
      fd.append('prescription', file)
      try {
        await axios.post('/api/prescriptions', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        ok++
      } catch (err) {
        showFlash(`${file.name}: ${err.response?.data?.error || 'upload failed'}`, 'error')
      }
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    if (ok) { showFlash(`Uploaded ${ok} file${ok === 1 ? '' : 's'}`, 'success'); fetchItems() }
  }

  async function handleDelete(p) {
    if (!confirm(`Delete ${p.original_filename}? This can't be undone.`)) return
    try {
      await axios.delete(`/api/prescriptions/${p.id}`)
      fetchItems()
    } catch {
      showFlash('Could not delete', 'error')
    }
  }

  const visible = items.filter(p => p.original_filename.toLowerCase().includes(globalSearch.toLowerCase()))

  return (
    <div className="stack-lg animate-in">
      <header className="page-head">
        <div>
          <h1 className="page-title">Prescriptions</h1>
          <p className="page-sub">Photos and PDFs of prescriptions and reports, kept in one place.</p>
        </div>
      </header>

      <label
        className={`dropzone${dragging ? ' is-drag' : ''}${uploading ? ' is-busy' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files) }}
      >
        <input ref={inputRef} type="file" accept={ACCEPT} multiple className="sr-only"
          onChange={e => upload(e.target.files)} disabled={uploading} />
        <i className={`fa-solid ${uploading ? 'fa-circle-notch fa-spin' : 'fa-cloud-arrow-up'}`} aria-hidden="true" />
        <div>
          <p className="dropzone-title">{uploading ? 'Uploading' : 'Drop files here or click to upload'}</p>
          <p className="muted small">JPG, PNG, WebP or PDF, up to 16 MB each</p>
        </div>
      </label>

      {loading ? (
        <div className="doc-grid">{[0, 1, 2, 3].map(i => <div key={i} className="skeleton block" style={{ height: '13.75rem' }} />)}</div>
      ) : visible.length === 0 ? (
        <div className="card">
          <EmptyState image="/images/empty-prescriptions-240.webp" icon="fa-file-medical"
            title={globalSearch ? 'No matching documents' : 'No documents yet'}>
            {globalSearch ? 'Try a different filter.' : 'Upload a photo of a prescription so it is with you at the pharmacy or your next appointment.'}
          </EmptyState>
        </div>
      ) : (
        <>
          <p className="muted small">{visible.length} document{visible.length === 1 ? '' : 's'}</p>
          <ul className="doc-grid">
            {visible.map(p => {
              const url = `/api/uploads/${p.filename}`
              const pdf = isPdf(p.filename)
              const date = parseUtc(p.upload_date)
              return (
                <li key={p.id} className="doc">
                  <button className="doc-preview" onClick={() => pdf ? window.open(url, '_blank', 'noopener') : openPrescriptionModal(url, p.original_filename)}
                    aria-label={`Open ${p.original_filename}`}>
                    {pdf
                      ? <span className="doc-pdf"><i className="fa-regular fa-file-pdf" /><span>PDF</span></span>
                      : <img src={url} alt="" loading="lazy" />}
                  </button>
                  <div className="doc-info">
                    <div className="grow">
                      <p className="doc-name" title={p.original_filename}>{p.original_filename}</p>
                      <p className="muted small">{date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</p>
                    </div>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon btn-sm" aria-label="Open in new tab">
                      <i className="fa-solid fa-arrow-up-right-from-square" />
                    </a>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(p)} aria-label={`Delete ${p.original_filename}`}>
                      <i className="fa-regular fa-trash-can" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
