import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import React from 'react'
import { useOutletContext } from 'react-router-dom'

export default function Nutrition() {
  const { request, loading, error, setError } = useApi()
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [history, setHistory] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const { globalSearch = '' } = useOutletContext() || {}

  const fetchHistory = async () => {
    try {
      const data = await request('get', '/api/nutrition/history')
      setHistory(data.history || [])
    } catch (e) {}
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setIsSearching(true)
    setError(null)
    try {
      const data = await request('post', '/api/nutrition/search', { food: query })
      setSearchResults(data.results || [])
    } catch (err) {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSave = async (food) => {
    try {
      await request('post', '/api/nutrition/save', {
        food_name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat
      })
      fetchHistory()
      // Optional: show some feedback that it was saved
    } catch (e) {}
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this entry?')) {
      try {
        await request('delete', `/api/nutrition/history/${id}`)
        fetchHistory()
      } catch (e) {}
    }
  }

  // Calculate totals
  const filteredHistory = history.filter(item => item.food_name.toLowerCase().includes(globalSearch.toLowerCase()))

  const totals = filteredHistory.reduce((acc, item) => ({
    calories: acc.calories + item.calories,
    protein: acc.protein + item.protein,
    carbs: acc.carbs + item.carbs,
    fat: acc.fat + item.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nutrition Tracker</h1>
          <p className="text-secondary">Search foods and log your daily intake.</p>
        </div>
      </div>

      <div className="nutrition-container">
        {/* Left Column - Search & Daily Summary */}
        <div className="nutrition-left">
          {/* Daily Summary Card */}
          <div className="nutrition-summary-card hover-lift">
            <h3 className="summary-title"><i className="fa-solid fa-chart-pie"></i> Daily Summary</h3>
            <div className="macro-grid">
              <div className="macro-item">
                <div className="macro-label">Calories</div>
                <div className="macro-value text-primary">{Math.round(totals.calories)}</div>
                <div className="macro-unit">kcal</div>
              </div>
              <div className="macro-item">
                <div className="macro-label">Protein</div>
                <div className="macro-value text-success">{Math.round(totals.protein)}</div>
                <div className="macro-unit">g</div>
              </div>
              <div className="macro-item">
                <div className="macro-label">Carbs</div>
                <div className="macro-value text-warning">{Math.round(totals.carbs)}</div>
                <div className="macro-unit">g</div>
              </div>
              <div className="macro-item">
                <div className="macro-label">Fat</div>
                <div className="macro-value text-danger">{Math.round(totals.fat)}</div>
                <div className="macro-unit">g</div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="search-section">
            <h3 className="section-title">Add Food</h3>
            <form onSubmit={handleSearch} className="search-form">
              <div className="input-wrapper search-wrapper">
                <i className="fa-solid fa-utensils input-icon"></i>
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. Apple, Chicken breast..." 
                  className="search-input"
                />
                <button type="submit" className="search-btn" disabled={isSearching}>
                  {isSearching ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Search'}
                </button>
              </div>
            </form>
            
            {error && <div className="text-danger mt-2 text-sm"><i className="fa-solid fa-circle-exclamation"></i> {error}</div>}

            <div className="search-results">
              {searchResults.length > 0 && searchResults.map((food, idx) => (
                <div key={idx} className="food-result-card animate-fade-up" style={{'--delay': `${idx * 50}ms`}}>
                  <div className="food-info">
                    <h4 className="food-name">{food.name}</h4>
                    <div className="food-macros">
                      <span><i className="fa-solid fa-fire text-primary"></i> {food.calories} kcal</span>
                      <span>P: {food.protein}g</span>
                      <span>C: {food.carbs}g</span>
                      <span>F: {food.fat}g</span>
                    </div>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => handleSave(food)}>
                    <i className="fa-solid fa-plus"></i> Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - History Log */}
        <div className="nutrition-right">
          <div className="history-section">
            <h3 className="section-title"><i className="fa-solid fa-clock-rotate-left"></i> Food Log</h3>
            
            <div className="history-list">
              {loading && history.length === 0 ? (
                <div style={{display:'flex', justifyContent:'center', padding:'2rem'}}><div className="spinner"></div></div>
              ) : filteredHistory.length === 0 ? (
                <div className="empty-state sm">
                  <div className="empty-icon"><i className="fa-solid fa-plate-wheat"></i></div>
                  <p>Your food log is empty.</p>
                </div>
              ) : (
                filteredHistory.map(item => (
                  <div key={item.id} className="history-item hover-lift">
                    <div className="history-info">
                      <h4 className="history-food-name">{item.food_name}</h4>
                      <div className="history-macros">
                        <span className="badge badge-primary">{item.calories} kcal</span>
                        <span className="badge badge-success">P: {item.protein}g</span>
                        <span className="badge badge-warning">C: {item.carbs}g</span>
                      </div>
                    </div>
                    <button className="icon-btn btn-danger-outline" onClick={() => handleDelete(item.id)} aria-label="Delete log">
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
