/**
 * NutriCare-360 logo: the app-icon mark plus a live-text wordmark coloured like the
 * logo artwork (Nutri · Care · -360). Assets come from frontend/image-sources via
 * scripts/optimize_images.py. `onDark` lightens the wordmark for dark surfaces.
 */
export default function Logo({ onDark = false, showName = true, size = 30, className = '' }) {
  return (
    <span className={`logo${onDark ? ' on-dark' : ''} ${className}`}>
      <img
        className="logo-mark"
        src="/images/logo-mark-64.webp"
        srcSet="/images/logo-mark-64.webp 1x, /images/logo-mark-128.webp 2x"
        width={size}
        height={size}
        alt={showName ? '' : 'NutriCare-360'}
        decoding="async"
      />
      {showName && (
        <span className="logo-name">
          <span className="wm-nutri">Nutri</span>
          <span className="wm-care">Care</span>
          <span className="wm-360">-360</span>
        </span>
      )}
    </span>
  )
}
