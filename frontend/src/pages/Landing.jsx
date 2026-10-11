import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ResponsiveImg from '../components/ui/ResponsiveImg'
import Logo from '../components/ui/Logo'
import '../styles/landing.css'

export default function Landing() {
  const { user } = useAuth()
  const { theme, toggle } = useTheme()
  const start = user ? '/dashboard' : '/register'

  return (
    <div className="lp">
      <LandingNav user={user} theme={theme} onToggleTheme={toggle} />

      <header className="lp-hero lp-wrap">
        <div className="lp-hero-text">
          <p className="eyebrow">Personal health tracker</p>
          <h1>Meals, medications and movement, in one calm place.</h1>
          <p className="lp-lead">
            Tell it what you ate in plain words and get the macros. Tick off each dose as you take it.
            Get a short daily read on how you're doing, written from your own logs.
          </p>
          <div className="row gap-sm wrap">
            <Link to={start} className="btn btn-primary btn-lg">{user ? 'Open your dashboard' : 'Create a free account'}</Link>
            <a href="#features" className="btn btn-secondary btn-lg">See how it works</a>
          </div>
          <p className="lp-fine">Free · No ads · Your data stays in your account</p>
        </div>

        <div className="lp-hero-media">
          <ResponsiveImg base="/images/hero" widths={[640, 1024]} width={1024} height={1024} priority
            sizes="(max-width: 960px) min(520px, calc(100vw - 2rem)), 540px"
            alt="A woman checking her daily health summary on her phone" />
          <div className="lp-float lp-float-hero" aria-hidden="true">
            <p className="lp-float-label">Today</p>
            <div className="lp-mini-ring">
              <svg viewBox="0 0 44 44" width="44" height="44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--track)" strokeWidth="5" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray="70 113" transform="rotate(-90 22 22)" />
              </svg>
              <div>
                <p className="lp-float-big">1,240 <span>/ 2,000 kcal</span></p>
                <p className="lp-float-sub">2 of 3 medications taken</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="lp-features lp-wrap">
        <FeatureRow
          id="nutrition"
          image="/images/feature-meal"
          eyebrow="Nutrition"
          title="Describe a meal. Get the numbers."
          text="Type “two scrambled eggs, toast with butter, black coffee” and each item comes back with calories, protein, carbs and fat. Untick anything you didn't eat, then log the rest in one tap. Prefer exact labels? Search the Open Food Facts database instead."
          overlay={
            <div className="lp-card">
              <p className="lp-card-q">“2 scrambled eggs, toast with butter, coffee”</p>
              <table className="lp-card-table">
                <tbody>
                  <tr><td>2 scrambled eggs</td><td>182 kcal</td></tr>
                  <tr><td>Toast with butter</td><td>106 kcal</td></tr>
                  <tr><td>Black coffee</td><td>2 kcal</td></tr>
                </tbody>
              </table>
              <p className="lp-card-total">Log 3 items · 290 kcal</p>
            </div>
          }
        />
        <FeatureRow
          reverse
          id="medications"
          image="/images/feature-meds"
          eyebrow="Medications"
          title="A checklist for every dose."
          text="Add each medication with its dose and time. Your Today page turns it into a checklist, sorted by time, so it's obvious what's left. Prescriptions live alongside, as photos or PDFs you can pull up at the pharmacy."
          overlay={
            <ul className="lp-card lp-checklist">
              <li className="done"><span>8:00 AM</span>Metformin 500 mg<i className="fa-solid fa-check" /></li>
              <li className="done"><span>9:00 AM</span>Vitamin D 1000 IU<i className="fa-solid fa-check" /></li>
              <li><span>8:00 PM</span>Metformin 500 mg<i className="fa-regular fa-circle" /></li>
            </ul>
          }
        />
        <FeatureRow
          id="yoga"
          image="/images/feature-yoga"
          eyebrow="Yoga"
          title="A routine for the time you have."
          text="Pick a goal, such as lower back relief or winding down for sleep, and a length. You get a sequence from the pose library in a safe order, with a cue for each pose and a timer to follow along."
          overlay={
            <ol className="lp-card lp-routine">
              <li><span>3 min</span>Cat-Cow Stretch</li>
              <li><span>3 min</span>Cobra Pose</li>
              <li><span>4 min</span>Bridge Pose</li>
              <li><span>5 min</span>Savasana</li>
            </ol>
          }
        />
      </section>

      <section id="included" className="lp-more lp-wrap">
        <h2>Also in the app</h2>
        <div className="lp-more-grid">
          <div>
            <i className="fa-regular fa-newspaper" />
            <h3>Daily brief</h3>
            <p>Three observations about today's meals and doses, plus an idea for your next meal that fits what's left.</p>
          </div>
          <div>
            <i className="fa-regular fa-comment-dots" />
            <h3>Assistant</h3>
            <p>Ask questions about your own week. It reads your logs, keeps answers short, and never tells you to change a dose.</p>
          </div>
          <div>
            <i className="fa-solid fa-chart-column" />
            <h3>Weekly view</h3>
            <p>Calories per day against your goal, with averages that only count the days you actually logged.</p>
          </div>
          <div>
            <i className="fa-regular fa-id-card" />
            <h3>Health card</h3>
            <p>Export a one-image summary of your week to share with a coach, dietitian or family member.</p>
          </div>
        </div>
      </section>

      <section className="lp-cta lp-wrap">
        <div>
          <h2>Start with today's breakfast.</h2>
          <p>Log one meal and one medication, and the dashboard takes it from there.</p>
        </div>
        <Link to={start} className="btn btn-primary btn-lg">{user ? 'Open your dashboard' : 'Create a free account'}</Link>
      </section>

      <LandingFooter user={user} />
    </div>
  )
}

function FeatureRow({ id, image, eyebrow, title, text, overlay, reverse }) {
  const [imgOk, setImgOk] = useState(true)
  return (
    <article id={id} className={`lp-row${reverse ? ' reverse' : ''}`}>
      <div className="lp-row-text">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <div className={`lp-row-media${imgOk ? '' : ' no-img'}`}>
        {imgOk && (
          <ResponsiveImg base={image} widths={[640, 1200]} width={1200} height={900}
            sizes="(max-width: 960px) calc(100vw - 2rem), 600px" onError={() => setImgOk(false)} />
        )}
        <div className="lp-row-overlay">{overlay}</div>
      </div>
    </article>
  )
}

const NAV_LINKS = [
  { href: '#nutrition', label: 'Nutrition' },
  { href: '#medications', label: 'Medications' },
  { href: '#yoga', label: 'Yoga' },
  { href: '#included', label: "What's included" },
]

/** Full-width bar at the top of the page; condenses into a floating pill once you scroll. */
function LandingNav({ user, theme, onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setScrolled(window.scrollY > 24)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update() // page may be restored mid-scroll
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [])

  return (
    <nav className={`lp-nav${scrolled ? ' is-scrolled' : ''}`} aria-label="Main">
      <div className="lp-nav-bar">
        <Link to="/" className="brand-inline" aria-label="NutriCare-360 home">
          <Logo size={32} />
        </Link>
        <div className="lp-nav-links">
          {NAV_LINKS.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
        </div>
        <div className="lp-nav-actions">
          <button onClick={onToggleTheme} className="btn btn-ghost btn-icon btn-sm" aria-label="Toggle theme">
            <i className={theme === 'dark' ? 'fa-regular fa-sun' : 'fa-regular fa-moon'} />
          </button>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm lp-pill-btn">Open app</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm hide-xs">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm lp-pill-btn">Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

const SOCIALS = [
  { href: 'https://github.com/SairajJadhav08', icon: 'fa-github', label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/sairaj-jadhav-/', icon: 'fa-linkedin-in', label: 'LinkedIn' },
  { href: 'https://www.instagram.com/sairajjadhav08/', icon: 'fa-instagram', label: 'Instagram' },
]

function LandingFooter({ user }) {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <Link to="/" className="brand-inline" aria-label="NutriCare-360 home">
              <Logo size={36} />
            </Link>
            <p>
              A personal tracker for meals, medications and movement, with an assistant
              that works from your own logs.
            </p>
            <div className="lp-social">
              {SOCIALS.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                  <i className={`fa-brands ${s.icon}`} />
                </a>
              ))}
            </div>
          </div>

          <div className="lp-footer-cols">
            <div>
              <h3>Product</h3>
              <ul>
                <li><a href="#nutrition">Meal logging</a></li>
                <li><a href="#medications">Medication checklist</a></li>
                <li><a href="#yoga">Yoga routines</a></li>
                <li><a href="#included">Daily brief & assistant</a></li>
              </ul>
            </div>
            <div>
              <h3>Account</h3>
              <ul>
                {user ? (
                  <>
                    <li><Link to="/dashboard">Open dashboard</Link></li>
                    <li><Link to="/profile">Profile & goals</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/register">Create an account</Link></li>
                    <li><Link to="/login">Log in</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3>Project</h3>
              <ul>
                <li><a href="/apidocs" target="_blank" rel="noopener noreferrer">API reference</a></li>
                <li><a href="https://github.com/SairajJadhav08" target="_blank" rel="noopener noreferrer">Source on GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <p>© {new Date().getFullYear()} NutriCare-360 · Built by Sairaj Jadhav</p>
          <p>Not a medical device. Always follow your clinician's advice.</p>
          <a href="#top" className="lp-top-link" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            Back to top <i className="fa-solid fa-arrow-up" />
          </a>
        </div>
      </div>
    </footer>
  )
}
