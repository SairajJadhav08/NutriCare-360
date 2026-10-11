import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import Logo from '../ui/Logo'

const POINTS = [
  'Describe a meal in plain words and get the macros',
  'A daily checklist for every medication',
  'Yoga routines timed to the minutes you have',
]

export default function AuthLayout({ title, subtitle, children, footer }) {
  const { theme, toggle } = useTheme()
  const [imgOk, setImgOk] = useState(true)

  return (
    <div className="auth">
      <aside className={`auth-art${imgOk ? '' : ' no-img'}`}>
        {imgOk && (
          // Desktop only: the panel is hidden below 961px, and the 1x1 fallback means phones download nothing
          <picture>
            <source media="(min-width: 961px)" type="image/webp"
              srcSet="/images/auth-side-600.webp 600w, /images/auth-side-896.webp 896w" sizes="50vw" />
            <img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt=""
              fetchPriority="high" decoding="async" onError={() => setImgOk(false)} />
          </picture>
        )}
        <div className="auth-art-inner">
          <Link to="/" className="brand-inline" aria-label="NutriCare-360 home">
            <Logo onDark size={34} />
          </Link>
          <div>
            <p className="auth-art-quote">Meals, medications and movement, in one calm place.</p>
            <ul className="auth-points">
              {POINTS.map(p => <li key={p}><i className="fa-solid fa-check" />{p}</li>)}
            </ul>
          </div>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-top">
          <Link to="/" className="brand-inline auth-mobile-brand" aria-label="NutriCare-360 home">
            <Logo />
          </Link>
          <button onClick={toggle} className="btn btn-ghost btn-icon" aria-label="Toggle theme">
            <i className={theme === 'dark' ? 'fa-regular fa-sun' : 'fa-regular fa-moon'} />
          </button>
        </div>
        <div className="auth-form-wrap">
          <h1 className="auth-title">{title}</h1>
          <p className="auth-sub">{subtitle}</p>
          {children}
          <p className="auth-foot">{footer}</p>
        </div>
      </main>
    </div>
  )
}
