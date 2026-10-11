import { fmt } from '../../lib/format'

/** Calories consumed against the daily goal. The center states the remaining number. */
export default function CalorieRing({ consumed, goal, size = 148 }) {
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = goal > 0 ? Math.min(1, consumed / goal) : 0
  const over = consumed > goal
  const remaining = Math.abs(Math.round(goal - consumed))

  return (
    // Sized in rem so the ring scales with the root font size like the rest of the UI
    <div className="cal-ring" style={{ width: `${size / 16}rem`, height: `${size / 16}rem` }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} role="img"
        aria-label={`${fmt(consumed)} of ${fmt(goal)} kcal eaten today`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={over ? 'var(--danger)' : 'var(--primary)'}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 600ms cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="cal-ring-center">
        <span className="cal-ring-value">{fmt(remaining)}</span>
        <span className="cal-ring-label">{over ? 'kcal over' : 'kcal left'}</span>
      </div>
    </div>
  )
}
