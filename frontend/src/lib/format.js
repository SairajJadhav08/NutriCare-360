// Small, dependency-free helpers shared across pages.

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 5) return 'Good evening'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function longDate(date = new Date()) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

/** "08:30" -> "8:30 AM" in the user's locale */
export function formatClock(hhmm) {
  if (!hhmm || !/^\d{1,2}:\d{2}/.test(hhmm)) return hhmm || ''
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** SQLite CURRENT_TIMESTAMP is UTC without a zone marker */
export function parseUtc(ts) {
  if (!ts) return null
  return new Date(ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z')
}

export function timeOf(ts) {
  const d = parseUtc(ts)
  return d ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''
}

export function dayLabel(dateStr) {
  // dateStr: YYYY-MM-DD (UTC day from SQLite)
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((today - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export const fmt = n => Math.round(Number(n) || 0).toLocaleString()

/** Suggested daily macro targets from a calorie goal (20% protein, 50% carbs, 30% fat). */
export function macroTargets(goal) {
  return {
    protein: Math.round((goal * 0.20) / 4),
    carbs:   Math.round((goal * 0.50) / 4),
    fat:     Math.round((goal * 0.30) / 9),
  }
}

export function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Poses listed twice in the library share one image
const POSE_ALIASES = {
  'tree-pose': 'vrikshasana-tree-pose',
  'corpse-pose': 'savasana-corpse-pose',
  'sun-salutation-a': 'surya-namaskara-sun-salutation',
}

export const POSE_WIDTHS = [240, 480, 960]

/** Base path of a generated pose image (variants: `${base}-${w}.webp`, see scripts/optimize_images.py). */
export function poseImage(name) {
  const slug = slugify(name)
  return `/images/yoga/${POSE_ALIASES[slug] || slug}`
}
