export function LoginVisual() {
  return (
    <svg
      viewBox="0 0 560 420"
      fill="none"
      aria-hidden="true"
      className="w-full max-w-[540px]"
    >
      <defs>
        <radialGradient id="login-sun" cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#fff8e9" />
          <stop offset="38%" stopColor="#ffd68c" />
          <stop offset="78%" stopColor="#ce7f33" />
          <stop offset="100%" stopColor="#ce7f3300" />
        </radialGradient>
        <linearGradient id="login-arc" x1="82" y1="300" x2="488" y2="120">
          <stop offset="0%" stopColor="#7dd1ff" stopOpacity="0" />
          <stop offset="42%" stopColor="#7dd1ff" stopOpacity="0.55" />
          <stop offset="72%" stopColor="#ffc66d" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffc66d" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="login-horizon" x1="0" y1="0" x2="560" y2="0">
          <stop offset="0%" stopColor="#ffffff00" />
          <stop offset="50%" stopColor="#ffffff2b" />
          <stop offset="100%" stopColor="#ffffff00" />
        </linearGradient>
      </defs>

      <circle cx="382" cy="158" r="108" fill="url(#login-sun)" opacity="0.28" />
      <circle cx="382" cy="158" r="34" fill="url(#login-sun)" />
      <circle
        cx="382"
        cy="158"
        r="64"
        stroke="#ffc66d"
        strokeOpacity="0.22"
        strokeWidth="1"
        strokeDasharray="2 7"
      />

      <path
        d="M42 302C132 302 208 292 286 246c74-44 148-96 234-120"
        stroke="url(#login-arc)"
        strokeWidth="1.5"
      />
      <path
        d="M76 338C172 336 252 318 328 274c70-40 128-78 196-92"
        stroke="url(#login-arc)"
        strokeWidth="1"
        strokeOpacity="0.55"
      />
      <path
        d="M20 268C118 266 196 250 268 212 338 176 412 140 520 132"
        stroke="#ffffff"
        strokeOpacity="0.09"
        strokeWidth="1"
      />

      <path d="M0 360h560" stroke="url(#login-horizon)" strokeWidth="1" />
      <path d="M0 382h560" stroke="url(#login-horizon)" strokeWidth="1" strokeOpacity="0.5" />

      <g fill="#ffc66d">
        <circle cx="188" cy="290" r="2.2" opacity="0.85" />
        <circle cx="262" cy="258" r="1.6" opacity="0.65" />
        <circle cx="330" cy="222" r="2.6" opacity="0.9" />
        <circle cx="418" cy="176" r="1.8" opacity="0.6" />
      </g>
      <g fill="#7dd1ff">
        <circle cx="124" cy="314" r="1.8" opacity="0.7" />
        <circle cx="228" cy="276" r="1.4" opacity="0.5" />
        <circle cx="368" cy="202" r="1.5" opacity="0.55" />
      </g>

      <g stroke="#ffffff" strokeOpacity="0.12">
        <path d="M382 94v-18M382 222v18M318 158h-18M446 158h18" />
      </g>
    </svg>
  );
}
