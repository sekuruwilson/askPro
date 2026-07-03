/**
 * NisrLogo — wraps the real NISR logo PNG.
 *
 * The logo is white + blue on a transparent background.
 * - On dark backgrounds (navy sidebar): render directly, no wrapper needed.
 * - On light/white backgrounds: wrap in a navy circle so the white part shows.
 *
 * Props:
 *   size    — pixel size (default 32)
 *   dark    — true  → logo on navy circle (for light backgrounds)
 *             false → logo directly, no bg (for dark/navy backgrounds)
 */
export default function NisrLogo({ size = 32, dark = false }) {
  if (dark) {
    // Used on white backgrounds — navy circle container
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-navy-800 flex items-center justify-center flex-shrink-0 overflow-hidden p-1.5"
      >
        <img
          src="/logo.png"
          alt="NISR Logo"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    )
  }

  // Used on dark/navy backgrounds — logo directly, no wrapper
  return (
    <img
      src="/logo.png"
      alt="NISR Logo"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
    />
  )
}
