import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../hooks/useApi'
import React from 'react'
import { useOutletContext } from 'react-router-dom'

const PERIODS = ['Today', 'Week', 'All']

export default function Nutrition() {
  const { request, loading, error, setError } = useApi()
  const [query, setQuery]               = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [history, setHistory]           = useState([])
  const [isSearching, setIsSearching]   = useState(false)
  const [period, setPeriod]             = useState('Today')
  const [customDate, setCustomDate]     = useState('')
  const [calorieGoal, setCalorieGoal]   = useState(2000)
  // AI analyzer
  const [aiMeal, setAiMeal]             = useState('')
  const [aiResult, setAiResult]         = useState(null)
  const [aiLoading, setAiLoading]       = useState(false)
  const [aiError, setAiError]           = useState(null)
  const [showAi, setShowAi]             = useState(false)

  const { globalSearch = '' } = useOutletContext() || {}

  // ── fetch calorie goal ────────────────────────────────────────────
  useEffect(() => {
    request('get', '/api/settings')
      .then(d => setCalorieGoal(d.calorie_goal || 2000))
      .catch(() => {})
  }, [request])

  // ── fetch history ─────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    try {
      let url = '/api/nutrition/history'
      if (customDate) {
        url += `?date=${customDate}`
      } else if (period === 'Today') {
        url += '?period=today'
      } else if (period === 'Week') {
        url += '?period=week'
      }
      const data = await request('get', url)
      setHistory(data.history || [])
    } catch (err) {
      console.error(err)
    }
  }, [period, customDate, request])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  // ── search ────────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setIsSearching(true)
    setError(null)
    try {
      const data = await request('post', '/api/nutrition/search', { food: query })
      setSearchResults(data.results || [])
    } catch { setSearchResults([]) }
    finally { setIsSearching(false) }
  }

  // ── save food ─────────────────────────────────────────────────────
  const handleSave = async (food) => {
    try {
      await request('post', '/api/nutrition/save', {
        food_name: food.name, calories: food.calories,
        protein: food.protein, carbs: food.carbs, fat: food.fat
      })
      fetchHistory()
    } catch (err) {
      console.error(err)
    }
  }

  // ── delete log entry ──────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return
    try {
      await request('delete', `/api/nutrition/history/${id}`)
      fetchHistory()
    } catch (err) {
      console.error(err)
    }
  }

  // ── AI analyze ────────────────────────────────────────────────────
  const handleAiAnalyze = async (e) => {
    e.preventDefault()
    if (!aiMeal.trim()) return
    setAiLoading(true)
    setAiError(null)
    setAiResult(null)
    try {
      const data = await request('post', '/api/nutrition/analyze', { meal: aiMeal })
      setAiResult(data.result)
    } catch (err) {
      setAiError(err.message || 'AI analysis failed')
    } finally { setAiLoading(false) }
  }

  // ── totals ────────────────────────────────────────────────────────
  const filteredHistory = history.filter(item =>
    item.food_name.toLowerCase().includes(globalSearch.toLowerCase())
  )
  const totals = filteredHistory.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein:  acc.protein  + item.protein,
      carbs:    acc.carbs    + item.carbs,
      fat:      acc.fat      + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
  const caloriePct = Math.min(100, Math.round((totals.calories / calorieGoal) * 100))
  const goalColor  = caloriePct >= 100 ? 'var(--danger)' : caloriePct >= 80 ? 'var(--warning)' : 'var(--success)'

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nutrition Tracker</h1>
          <p className="text-secondary">Search foods and log your daily intake.</p>
        </div>
        <button
          className={`btn btn-sm ${showAi ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setShowAi(v => !v)}
          title="AI meal analyzer"
        >
          <i className="fa-solid fa-wand-magic-sparkles"></i> AI Analyzer
        </button>
      </div>

      {/* AI Analyzer Panel */}
      {showAi && (
        <div className="ai-panel animate-fade-up">
          <div className="ai-panel-header">
            <i className="fa-solid fa-wand-magic-sparkles text-primary"></i>
            <h3>AI Meal Analyzer</h3>
            <span className="ai-badge">Powered by Groq</span>
          </div>
          <form onSubmit={handleAiAnalyze} className="ai-form">
            <input
              type="text"
              value={aiMeal}
              onChange={e => setAiMeal(e.target.value)}
              placeholder='Describe your meal, e.g. "2 eggs, toast with butter, glass of OJ"'
              className="ai-input"
            />
            <button type="submit" className="btn btn-primary" disabled={aiLoading}>
              {aiLoading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Analyzing…</> : 'Analyze'}
            </button>
          </form>
          {aiError && <p className="ai-error"><i className="fa-solid fa-triangle-exclamation"></i> {aiError}</p>}
          {aiResult && (
            <div className="ai-result animate-fade-up">
              <h4 className="ai-result-name">{aiResult.name}</h4>
              <div className="food-macros">
                <span><i className="fa-solid fa-fire text-primary"></i> {aiResult.calories} kcal</span>
                <span>P: {aiResult.protein}g</span>
                <span>C: {aiResult.carbs}g</span>
                <span>F: {aiResult.fat}g</span>
              </div>
              <button className="btn btn-outline btn-sm" style={{marginTop:'0.75rem'}} onClick={() => handleSave(aiResult)}>
                <i className="fa-solid fa-plus"></i> Add to Log
              </button>
            </div>
          )}
        </div>
      )}

      <div className="nutrition-container">
        {/* Left Column */}
        <div className="nutrition-left">
          {/* Daily Summary + Goal Progress */}
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

            {/* Calorie Goal Progress */}
            <div className="calorie-goal-section">
              <div className="calorie-goal-header">
                <span className="calorie-goal-label">Goal: {calorieGoal} kcal</span>
                <span className="calorie-goal-pct" style={{color: goalColor}}>{caloriePct}%</span>
              </div>
              <div className="calorie-goal-track">
                <div
                  className="calorie-goal-fill"
                  style={{ width: `${caloriePct}%`, background: goalColor }}
                ></div>
              </div>
              <p className="calorie-goal-remaining" style={{color: goalColor}}>
                {totals.calories >= calorieGoal
                  ? `${Math.round(totals.calories - calorieGoal)} kcal over goal`
                  : `${Math.round(calorieGoal - totals.calories)} kcal remaining`
                }
              </p>
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
              {searchResults.map((food, idx) => (
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

        {/* Right Column — History Log */}
        <div className="nutrition-right">
          <div className="history-section">
            <div className="history-header">
              <h3 className="section-title"><i className="fa-solid fa-clock-rotate-left"></i> Food Log</h3>
              {/* Period filter tabs */}
              <div className="period-tabs">
                {PERIODS.map(p => (
                  <button
                    key={p}
                    className={`period-tab ${period === p && !customDate ? 'active' : ''}`}
                    onClick={() => { setPeriod(p); setCustomDate('') }}
                  >{p}</button>
                ))}
                <input
                  type="date"
                  className="date-picker"
                  value={customDate}
                  onChange={e => { setCustomDate(e.target.value); setPeriod('') }}
                  title="Pick a specific date"
                />
              </div>
            </div>

            <div className="history-list">
              {loading && history.length === 0 ? (
                <div className="skeleton-list">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton-history-item">
                      <div className="skeleton-lines">
                        <div className="skeleton skeleton-line w-50"></div>
                        <div className="skeleton skeleton-line w-70"></div>
                      </div>
                      <div className="skeleton skeleton-circle-sm"></div>
                    </div>
                  ))}
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="empty-state sm">
                  <div className="empty-icon"><i className="fa-solid fa-plate-wheat"></i></div>
                  <p>No food logged{period === 'Today' ? ' today' : period === 'Week' ? ' this week' : ''}.</p>
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
