// Cropped, transparent-background versions of the brand logo
// (ledlum/images/logo/LEDLUM-Logo-black.png on R2 — that source has a solid
// white background and wide padding). `white` swaps the black wordmark for a
// white one, for dark backgrounds; the orange mark is the same in both.
export default function LedlumLogo({
  className = '',
  white = false
}: {
  className?: string;
  white?: boolean
}) {
  return (
    <img
      src={white ? "/ledlum-logo-white.png" : "/ledlum-logo.png"}
      alt="LEDLUM"
      className={className}
    />
  )
}
