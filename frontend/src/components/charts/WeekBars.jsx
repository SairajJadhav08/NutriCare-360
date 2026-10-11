import { useState } from 'react'
import { fmt } from '../../lib/format'

const W = 420, H = 160, PAD_L = 4, PAD_R = 4, PAD_T = 18, PAD_B = 24

/** Daily calories for the last 7 days, with the goal as a dashed reference line. */
export default function WeekBars({ days, goal }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(goal * 1.15, ...days.map(d => d.calories), 1)
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const slot = plotW / days.length
  const barW = Math.min(30, slot - 10)
  const y = v => PAD_T + plotH - (v / max) * plotH
  const goalY = y(goal)

  return (
    <div className="weekbars">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label="Calories per day for the last 7 days" onMouseLeave={() => setHover(null)}>
        <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + plotH} y2={PAD_T + plotH} stroke="var(--border)" />
        <line x1={PAD_L} x2={W - PAD_R} y1={goalY} y2={goalY}
          stroke="var(--text-muted)" strokeDasharray="3 4" strokeWidth="1" />
        <text x={W - PAD_R} y={goalY - 5} textAnchor="end" className="chart-note">Goal {fmt(goal)}</text>

        {days.map((d, i) => {
          const cx = PAD_L + slot * i + slot / 2
          const h = Math.max(0, PAD_T + plotH - y(d.calories))
          const isToday = i === days.length - 1
          const date = new Date(d.date + 'T00:00:00')
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0}>
              {/* Hit target is the whole column, bigger than the bar */}
              <rect x={cx - slot / 2} y={PAD_T} width={slot} height={plotH} fill="transparent" />
              {d.calories > 0 ? (
                <path
                  d={roundedTop(cx - barW / 2, PAD_T + plotH - h, barW, h, Math.min(4, h))}
                  fill={isToday ? 'var(--primary)' : 'var(--bar-muted)'}
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
              ) : (
                <rect x={cx - barW / 2} y={PAD_T + plotH - 2} width={barW} height={2} rx={1} fill="var(--border)" />
              )}
              <text x={cx} y={H - 6} textAnchor="middle" className={`chart-axis${isToday ? ' is-today' : ''}`}>
                {date.toLocaleDateString(undefined, { weekday: 'narrow' })}
              </text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div className="chart-tip" style={{ left: `${((PAD_L + slot * hover + slot / 2) / W) * 100}%` }}>
          <span className="chart-tip-title">
            {new Date(days[hover].date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <span><strong>{fmt(days[hover].calories)}</strong> kcal</span>
          {days[hover].calories > 0 && (
            <span className="chart-tip-sub">P {days[hover].protein}g · C {days[hover].carbs}g · F {days[hover].fat}g</span>
          )}
        </div>
      )}
      <table className="sr-only">
        <caption>Calories per day</caption>
        <tbody>
          {days.map(d => <tr key={d.date}><th>{d.date}</th><td>{d.calories} kcal</td></tr>)}
        </tbody>
      </table>
    </div>
  )
}

function roundedTop(x, y, w, h, r) {
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`
}
