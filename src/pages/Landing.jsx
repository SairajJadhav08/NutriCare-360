import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import React from 'react'

export default function Landing() {
  const { user } = useAuth()
  const { theme, toggle } = useTheme()

  useEffect(() => {
    // Add landing-page class to body for specific background
    document.body.classList.add('landing-page')
    return () => document.body.classList.remove('landing-page')
  }, [])

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-container nav-container">
          <Link to="/" className="logo">
            <i className="fa-solid fa-heart-pulse"></i>
            <span>NutriCare-360</span>
          </Link>

          <div className="nav-links">
            <button onClick={toggle} className="icon-btn theme-toggle" aria-label="Toggle theme">
              <i className={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
            </button>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">Log in</Link>
                <Link to="/register" className="btn btn-primary">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Background Orbs */}
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        <div className="hero-orb hero-orb-3"></div>

        <div className="hero-inner">
          <div className="animate-fade-up" style={{ '--delay': '0ms' }}>
            <div className="hero-badge">
              <span className="badge-dot"></span>
              NutriCare-360 is live
            </div>
          </div>

          <h1 className="hero-title animate-fade-up" style={{ '--delay': '100ms' }}>
            Your Complete <br />
            <span className="gradient-text">Health Operating System</span>
          </h1>

          <p className="hero-subtitle animate-fade-up" style={{ '--delay': '200ms' }}>
            Manage medications, track nutrition, and discover curated yoga routines all in one place. <span className="hide-mobile">The professional approach to your personal well-being.</span>
          </p>

          <div className="hero-buttons animate-fade-up" style={{ '--delay': '300ms' }}>
            <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">
              Start Building Habits
            </Link>
            <a href="#features" className="btn-outline-hero">
              <i className="fa-regular fa-compass"></i> Explore platform
            </a>
          </div>

          <div className="hero-banner-wrapper animate-fade-up" style={{ '--delay': '450ms' }}>
            <div className="hero-banner-frame">
              {/* Browser framing */}
              <div className="hero-frame-bar">
                <div className="hero-frame-dots">
                  <div className="dot dot-red"></div>
                  <div className="dot dot-yellow"></div>
                  <div className="dot dot-green"></div>
                </div>
                <div className="hero-frame-url">
                  <i className="fa-solid fa-lock"></i>
                  <span>app.nutricare360.com</span>
                </div>
              </div>

              {/* Main Banner Image inside frame */}
              <div className="hero-banner-img-wrap">
                {/* Note: In a real React app we'd use import or public folder for images */}
                <img src="/hero_banner.png" alt="NutriCare-360 App Interface" className="hero-banner-img" />
                <div className="hero-banner-overlay"></div>
                
                {/* Floating Chips */}
                <div className="hero-chip hero-chip-tl animate-chip" style={{ '--chip-delay': '800ms' }}>
                  <div className="chip-icon chip-icon-red"><i className="fa-solid fa-heart-pulse"></i></div>
                  <div className="chip-info">
                    <span className="chip-val">72 bpm</span>
                    <span className="chip-label">Resting</span>
                  </div>
                </div>

                <div className="hero-chip hero-chip-tr animate-chip" style={{ '--chip-delay': '950ms' }}>
                  <div className="chip-icon chip-icon-green"><i className="fa-solid fa-pills"></i></div>
                  <div className="chip-info">
                    <span className="chip-val">Meds</span>
                    <span className="chip-label">Taken</span>
                  </div>
                </div>

                <div className="hero-chip hero-chip-bl animate-chip" style={{ '--chip-delay': '1100ms' }}>
                  <div className="chip-icon chip-icon-orange"><i className="fa-solid fa-fire"></i></div>
                  <div className="chip-info">
                    <span className="chip-val">12 Days</span>
                    <span className="chip-label">Streak</span>
                  </div>
                </div>

                <div className="hero-chip hero-chip-br animate-chip" style={{ '--chip-delay': '1250ms' }}>
                  <div className="chip-icon chip-icon-purple"><i className="fa-solid fa-apple-whole"></i></div>
                  <div className="chip-info">
                    <span className="chip-val">Nutrition</span>
                    <span className="chip-label">Optimal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Grid inserted closely below */}
            <div className="hero-bento">
              
              {/* Wide Card 1 */}
              <div className="bento-card bento-card-wide">
                <i className="fa-solid fa-chart-line bento-bg-icon"></i>
                <div className="bento-icon-wrap bento-icon-green">
                  <i className="fa-solid fa-users"></i>
                </div>
                <div className="bento-main">
                  <div className="bento-number">10K+</div>
                  <div className="bento-desc">Active users tracking their daily health goals.</div>
                </div>
                <div className="bento-mini-chart">
                  <svg viewBox="0 0 200 40" preserveAspectRatio="none">
                    <path d="M0,40 L0,30 C20,30 40,35 60,25 C80,15 100,20 120,10 C140,0 160,15 180,5 L200,8 L200,40 Z" fill="url(#grad1)" opacity="0.2"></path>
                    <path d="M0,30 C20,30 40,35 60,25 C80,15 100,20 120,10 C140,0 160,15 180,5 L200,8" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Med Card */}
              <div className="bento-card bento-card-med">
                <i className="fa-solid fa-bullseye bento-bg-icon"></i>
                <div className="bento-icon-wrap bento-icon-orange">
                  <i className="fa-regular fa-calendar-check"></i>
                </div>
                <div className="bento-number small">95%</div>
                <div className="bento-desc">Medication adherence rate.</div>
                <span className="bento-tag">Industry Leading</span>
              </div>

              {/* Center Card */}
              <div className="bento-card bento-card-center">
                <i className="fa-solid fa-star bento-bg-icon"></i>
                <div className="bento-center-icon">
                  🚀
                </div>
                <div className="bento-number small">4.9</div>
                <div className="bento-stars">
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                </div>
                <div className="bento-desc">App Rating</div>
              </div>

              {/* Phone Card */}
              <div className="bento-card bento-card-phone">
                <i className="fa-solid fa-person-praying bento-bg-icon"></i>
                <div className="bento-phone-top">
                  <div className="bento-icon-wrap bento-icon-purple">
                    <i className="fa-solid fa-om"></i>
                  </div>
                  <div className="bento-phone-text">
                    <span className="bento-number small">22+</span>
                  </div>
                </div>
                <div className="bento-desc">Curated yoga routines for mindfulness.</div>
                <div className="bento-progress-wrap">
                  <div className="bento-progress-label"><span>Focus</span> <span>100%</span></div>
                  <div className="bento-progress-bar"><div className="bento-progress-fill" style={{ width: '100%' }}></div></div>
                </div>
              </div>

              {/* Wide Card 2 */}
              <div className="bento-card bento-card-wide2">
                <i className="fa-solid fa-file-prescription bento-bg-icon"></i>
                <div className="bento-left">
                  <div className="bento-icon-wrap bento-icon-red">
                    <i className="fa-solid fa-file-medical"></i>
                  </div>
                  <div className="bento-number small" data-counter="500000">500K+</div>
                  <div className="bento-desc">Prescriptions securely managed & tracked.</div>
                </div>
                <div className="bento-right-graphic">
                  <div className="bento-pill-stack">
                    <div className="bento-pill pill-1"><i className="fa-solid fa-check-circle"></i> Lisinopril 10mg</div>
                    <div className="bento-pill pill-2"><i className="fa-solid fa-check-circle"></i> Metformin 500mg</div>
                    <div className="bento-pill pill-3"><i className="fa-regular fa-clock"></i> Atorvastatin</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="features-header animate-fade-up">
          <h2 className="features-title">Powerful Features</h2>
          <p className="features-subtitle">Everything you need to manage your health effectively in one place.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card animate-fade-up" style={{'--delay': '100ms'}}>
            <div className="feature-icon"><i className="fa-solid fa-bell"></i></div>
            <h3 className="feature-title">Medicine Reminders</h3>
            <p className="feature-desc">Never miss a dose again with our intelligent reminder system. Set custom schedules and receive timely notifications.</p>
          </div>
          <div className="feature-card animate-fade-up" style={{'--delay': '200ms'}}>
            <div className="feature-icon"><i className="fa-solid fa-file-prescription"></i></div>
            <h3 className="feature-title">Prescription Storage</h3>
            <p className="feature-desc">Securely store and organize all your prescriptions in one place. Upload images and access them anytime.</p>
          </div>
          <div className="feature-card animate-fade-up" style={{'--delay': '300ms'}}>
            <div className="feature-icon"><i className="fa-solid fa-chart-line"></i></div>
            <h3 className="feature-title">Health Tracking</h3>
            <p className="feature-desc">Monitor your health progress with comprehensive tracking tools. Keep tabs on medication adherence and metrics.</p>
          </div>
          <div className="feature-card animate-fade-up" style={{'--delay': '400ms'}}>
            <div className="feature-icon"><i className="fa-solid fa-apple-whole"></i></div>
            <h3 className="feature-title">Nutrition Guide</h3>
            <p className="feature-desc">Access comprehensive nutrition information and maintain a balanced diet for optimal health.</p>
          </div>
          <div className="feature-card animate-fade-up" style={{'--delay': '500ms'}}>
            <div className="feature-icon"><i className="fa-solid fa-person-praying"></i></div>
            <h3 className="feature-title">Yoga & Wellness</h3>
            <p className="feature-desc">Explore yoga routines and wellness practices designed to improve your physical and mental well-being.</p>
          </div>
          <div className="feature-card animate-fade-up" style={{'--delay': '600ms'}}>
            <div className="feature-icon"><i className="fa-solid fa-shield-halved"></i></div>
            <h3 className="feature-title">Secure & Private</h3>
            <p className="feature-desc">Your health data is protected with enterprise-grade security. Your privacy is our top priority.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content animate-fade-up">
          <h2 className="cta-title">Ready to Transform Your Health?</h2>
          <p className="cta-subtitle">Join thousands of users who trust NutriCare-360 to manage their health effectively.</p>
          <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="footer-professional">
        <div className="footer-top">
          <div className="footer-brand-section">
            <Link to="/" className="logo footer-logo">
              <i className="fa-solid fa-heart-pulse"></i>
              <span>NutriCare-360</span>
            </Link>
            <p className="footer-tagline">The professional approach to your personal well-being. Manage medications, track nutrition, and discover curated yoga routines.</p>
            <div className="footer-socials">
              <a href="https://www.instagram.com/sairajjadhav08/" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
              <a href="https://github.com/SairajJadhav08" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="GitHub"><i className="fa-brands fa-github"></i></a>
              <a href="https://www.linkedin.com/in/sairaj-jadhav-/" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a>
            </div>
          </div>
          <div className="footer-links-grid">
            <div className="footer-column">
              <h4>Platform</h4>
              <Link to="#">Features</Link>
              <Link to="#">Integrations</Link>
              <Link to="#">FAQ</Link>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <Link to="#">About Us</Link>
              <Link to="#">Careers</Link>
              <Link to="#">Blog</Link>
              <Link to="#">Contact</Link>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <Link to="#">Privacy Policy</Link>
              <Link to="#">Terms of Service</Link>
              <Link to="#">Cookie Policy</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copyright">
            © {new Date().getFullYear()} NutriCare-360. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
