import { fmt, macroTargets } from '../../lib/format'

const MACROS = [
  { key: 'protein', label: 'Protein' },
  { key: 'carbs',   label: 'Carbs' },
  { key: 'fat',     label: 'Fat' },
]

/** Grams eaten per macro against a suggested target derived from the calorie goal. */
export default function MacroBars({ totals, goal, compact = false }) {
  const targets = macroTargets(goal)
  return (
    <div className={`macro-bars${compact ? ' compact' : ''}`}>
      {MACROS.map(({ key, label }) => {
        const value = Math.round(totals[key] || 0)
        const pct = Math.min(100, (value / targets[key]) * 100)
        return (
          <div className="macro-bar" key={key}>
            <div className="macro-bar-head">
              <span className="macro-bar-label">
                <span className={`swatch swatch-${key}`} aria-hidden="true" />{label}
              </span>
              <span className="macro-bar-value">
                <strong>{fmt(value)}</strong> / {targets[key]} g
              </span>
            </div>
            <div className="bar-track" role="progressbar" aria-label={`${label}: ${value} of ${targets[key]} grams`}
              aria-valuenow={value} aria-valuemin={0} aria-valuemax={targets[key]}>
              <div className={`bar-fill fill-${key}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
