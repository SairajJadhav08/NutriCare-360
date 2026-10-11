import { useState } from 'react'
import { poseImage, POSE_WIDTHS } from '../../lib/format'
import ResponsiveImg from './ResponsiveImg'

/**
 * Generated pose photo (public/images/yoga, responsive WebP). Poses without one — e.g. from
 * ExerciseDB — fall back to the API's image, then to a neutral placeholder.
 * `sizes` should describe how wide the image renders so the smallest sharp file is fetched.
 */
export default function PoseImage({ name, fallback, className = '', sizes = '300px', priority = false }) {
  const [stage, setStage] = useState(0) // 0 = generated, 1 = API fallback, 2 = placeholder

  if (stage === 0) {
    return (
      <ResponsiveImg
        base={poseImage(name)}
        widths={POSE_WIDTHS}
        sizes={sizes}
        alt={name}
        width={4}
        height={3}
        priority={priority}
        className={className}
        onError={() => setStage(fallback ? 1 : 2)}
      />
    )
  }
  if (stage === 1) {
    return <img src={fallback} alt={name} className={className} loading="lazy" decoding="async" onError={() => setStage(2)} />
  }
  return (
    <div className={`img-placeholder ${className}`} aria-hidden="true">
      <i className="fa-solid fa-spa" />
    </div>
  )
}
