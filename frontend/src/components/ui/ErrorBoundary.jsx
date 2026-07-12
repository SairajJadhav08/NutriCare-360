import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) this.props.onReset()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-wrap">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-msg">
              {this.state.error?.message || 'An unexpected error occurred on this page.'}
            </p>
            <div className="error-boundary-actions">
              <button className="btn btn-primary" onClick={this.handleReset}>
                <i className="fa-solid fa-rotate-right"></i> Try Again
              </button>
              <button className="btn btn-outline" onClick={() => window.location.href = '/dashboard'}>
                <i className="fa-solid fa-house"></i> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
