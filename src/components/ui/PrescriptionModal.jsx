// components/ui/PrescriptionModal.jsx
// Props: { src, alt, onClose }
// Renders a full-screen overlay with the image centered
// Closes on backdrop click or close button

export default function PrescriptionModal({ src, alt, onClose }) {
  if (!src) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Prescription image viewer"
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-3xl leading-none hover:text-gray-300 transition-colors"
          aria-label="Close modal"
        >
          &times;
        </button>
        <img
          src={src}
          alt={alt || 'Prescription'}
          className="w-full h-full object-contain max-h-[90vh] rounded"
        />
      </div>
    </div>
  )
}
