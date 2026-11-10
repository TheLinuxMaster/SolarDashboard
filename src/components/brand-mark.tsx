export function BrandMark({
  size = 34,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <radialGradient id="onyx-core" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#fff3d6" />
          <stop offset="45%" stopColor="#ffc66d" />
          <stop offset="100%" stopColor="#ce7f33" />
        </radialGradient>
        <linearGradient id="onyx-edge" x1="12" y1="6" x2="52" y2="58">
          <stop offset="0%" stopColor="rgba(255,198,109,0.85)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="100%" stopColor="rgba(125,209,255,0.55)" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 56 18v28L32 60 8 46V18Z"
        fill="rgba(255,255,255,0.035)"
        stroke="url(#onyx-edge)"
        strokeWidth="1.3"
      />
      <path
        d="M32 13.5 48.5 23v18L32 50.5 15.5 41V23Z"
        stroke="rgba(255,198,109,0.24)"
        strokeWidth="1"
      />
      <circle cx="32" cy="32" r="8.5" fill="url(#onyx-core)" />
      <circle cx="32" cy="32" r="13.5" stroke="rgba(255,198,109,0.48)" strokeWidth="1" strokeDasharray="1.5 5" />
      <circle cx="32" cy="32" r="21" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    </svg>
  );
}
