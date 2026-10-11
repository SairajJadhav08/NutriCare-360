// Renders the small markdown subset the assistant uses (paragraphs, -/1. lists, **bold**,
// simple | pipe | tables) as React elements — never as raw HTML.

function inline(text, keyBase) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? <strong key={`${keyBase}-${i}`}>{part.slice(2, -2)}</strong>
      : part
  )
}

const cells = line => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
const isDivider = line => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line.trim())

export default function RichText({ text }) {
  const blocks = []
  let list = null
  let table = null

  const flush = () => {
    if (list) { blocks.push(list); list = null }
    if (table) { blocks.push(table); table = null }
  }

  text.split('\n').forEach((raw) => {
    const line = raw.trim()
    if (line.startsWith('|') && line.includes('|', 1)) {
      if (list) { blocks.push(list); list = null }
      if (isDivider(line)) return
      if (!table) table = { type: 'table', head: cells(line), rows: [] }
      else table.rows.push(cells(line))
      return
    }
    const bullet = line.match(/^[-*•]\s+(.*)/)
    const numbered = line.match(/^\d+[.)]\s+(.*)/)
    if (bullet || numbered) {
      const type = bullet ? 'ul' : 'ol'
      if (table) { blocks.push(table); table = null }
      if (!list || list.type !== type) { if (list) blocks.push(list); list = { type, items: [] } }
      list.items.push((bullet || numbered)[1])
    } else if (line) {
      flush()
      blocks.push({ type: 'p', text: line.replace(/^#+\s*/, '') })
    } else {
      flush()
    }
  })
  flush()

  return (
    <div className="rich">
      {blocks.map((b, i) => {
        if (b.type === 'p') return <p key={i}>{inline(b.text, i)}</p>
        if (b.type === 'table') {
          return (
            <div key={i} className="rich-table-wrap">
              <table className="rich-table">
                <thead><tr>{b.head.map((h, j) => <th key={j}>{inline(h, `${i}-h${j}`)}</th>)}</tr></thead>
                <tbody>
                  {b.rows.map((r, j) => (
                    <tr key={j}>{r.map((c, k) => <td key={k}>{inline(c, `${i}-${j}-${k}`)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        const Tag = b.type
        return <Tag key={i}>{b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</Tag>
      })}
    </div>
  )
}
