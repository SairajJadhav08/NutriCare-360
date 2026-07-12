import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../hooks/useApi'
import React from 'react'
import { useOutletContext } from 'react-router-dom'
import axios from 'axios' // Need manual axios call for FormData

export default function Prescriptions() {
  const { request, loading: apiLoading, error: apiError, setError } = useApi()
  const [prescriptions, setPrescriptions] = useState([])
  const [uploading, setUploading] = useState(false)
  const { globalSearch = '' } = useOutletContext() || {}

  const fetchPrescriptions = useCallback(async () => {
    try {
      const data = await request('get', '/api/prescriptions')
      setPrescriptions(data.prescriptions)
    } catch (err) {
      console.error(err)
    }
  }, [request])

  useEffect(() => {
    fetchPrescriptions()
  }, [fetchPrescriptions])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('prescription', file)

    try {
      // Direct axios call because useApi wrapper stringifies data by default
      await axios.post('/api/prescriptions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      fetchPrescriptions()
      // reset file input
      e.target.value = null
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this prescription?')) {
      try {
        await request('delete', `/api/prescriptions/${id}`)
        fetchPrescriptions()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  }

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Prescriptions</h1>
          <p className="text-secondary">Securely store and access your medical documents.</p>
        </div>
        
        <label className="btn btn-primary" style={{cursor: 'pointer'}}>
          <input type="file" style={{display: 'none'}} onChange={handleUpload} accept="image/*,.pdf" disabled={uploading}/>
          {uploading ? <div className="spinner" style={{width:'16px', height:'16px', borderWidth:'2px'}}></div> : <><i className="fa-solid fa-cloud-arrow-up"></i> Upload Document</>}
        </label>
      </div>

      {(apiError) && <div className="flash-message flash-error">{apiError}</div>}

      <div className="prescriptions-grid">
        {apiLoading && prescriptions.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gridColumn: '1/-1' }}><div className="spinner"></div></div>
        ) : prescriptions.length === 0 ? (
           <div className="empty-state" style={{gridColumn: '1/-1'}}>
             <div className="empty-icon"><i className="fa-solid fa-file-medical"></i></div>
             <h3>No Prescriptions Found</h3>
             <p className="text-secondary">Upload your first prescription to keep it safe.</p>
           </div>
         ) : (
          prescriptions.filter(p => p.original_filename.toLowerCase().includes(globalSearch.toLowerCase())).map(p => (
            <div key={p.id} className="prescription-card hover-lift">
              <div className="prescription-preview">
                {/* Relying on backend static folder mapping through Vite proxy */}
                <img src={`/api/uploads/${p.filename}`} alt={p.original_filename} onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'/%3E%3C/svg%3E" 
                }}/>
                <button className="delete-prescription-btn" onClick={() => handleDelete(p.id)} aria-label="Delete">
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
              <div className="prescription-info">
                <h4 className="prescription-filename" title={p.original_filename}>{p.original_filename}</h4>
                <div className="prescription-date">
                  <i className="fa-regular fa-calendar"></i> {formatDate(p.upload_date)}
                </div>
                <div className="prescription-actions">
                  <a href={`/api/uploads/${p.filename}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm w-100">
                    <i className="fa-regular fa-eye"></i> View Full File
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
