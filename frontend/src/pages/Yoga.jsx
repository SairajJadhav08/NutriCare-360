import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import React from 'react'
import { useOutletContext } from 'react-router-dom'

export default function Yoga() {
  const { request, loading, error } = useApi()
  const [poses, setPoses] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const { globalSearch = '' } = useOutletContext() || {}

  useEffect(() => {
    const fetchPoses = async () => {
      try {
        const data = await request('get', '/api/yoga/poses')
        setPoses(data.poses || [])
      } catch (e) {}
    }
    fetchPoses()
  }, [])

  const categories = ['All', ...new Set(poses.map(p => p.category))]
  const filteredPoses = (activeCategory === 'All' 
    ? poses 
    : poses.filter(p => p.category === activeCategory)
  ).filter(p => p.name.toLowerCase().includes(globalSearch.toLowerCase()) || p.description.toLowerCase().includes(globalSearch.toLowerCase()))

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '1rem'}}>
        <div>
          <h1 className="page-title">Yoga & Fitness</h1>
          <p className="text-secondary">Explore curated poses for your well-being.</p>
        </div>
        
        {/* Category Filters */}
        <div className="category-filters" style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
          {categories.map(cat => (
            <button 
              key={cat}
              className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="flash-message flash-error">{error}</div>
      ) : loading && poses.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner"></div></div>
      ) : (
        <div className="yoga-grid">
          {filteredPoses.map((pose, idx) => (
            <div key={idx} className="yoga-card hover-lift animate-fade-up" style={{'--delay': `${(idx % 10) * 50}ms`}}>
              <div className="yoga-img-wrap">
                <img 
                  src={pose.image_url} 
                  alt={pose.name} 
                  className="yoga-img"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=500';
                  }}
                />
                <div className="yoga-category-badge">{pose.category}</div>
              </div>
              <div className="yoga-content">
                <h3 className="yoga-title">{pose.name}</h3>
                <p className="yoga-desc">{pose.description}</p>
                <div className="yoga-steps">
                  <h4 className="steps-title">How to do it:</h4>
                  <ol>
                    {pose.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
