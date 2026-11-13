// Original, hand-made SVG illustrations (free to use — part of this project).

export function HeroWallet({ className = '' }) {
  return (
    <svg viewBox="0 0 220 180" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hw-card1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity=".55" /></linearGradient>
        <linearGradient id="hw-card2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#f59e0b" /></linearGradient>
        <linearGradient id="hw-coin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fef3c7" /><stop offset="1" stopColor="#f59e0b" /></linearGradient>
      </defs>
      <g className="animate-float" style={{ transformOrigin: 'center' }}>
        <rect x="58" y="34" width="132" height="84" rx="14" fill="url(#hw-card2)" transform="rotate(-10 124 76)" opacity=".9" />
        <rect x="40" y="52" width="140" height="88" rx="16" fill="url(#hw-card1)" />
        <rect x="56" y="72" width="26" height="19" rx="5" fill="#a5b4fc" />
        <path d="M56 81h26M69 72v19" stroke="#6366f1" strokeWidth="1.4" opacity=".6" />
        <rect x="56" y="108" width="62" height="7" rx="3.5" fill="#6366f1" opacity=".35" />
        <rect x="124" y="108" width="34" height="7" rx="3.5" fill="#6366f1" opacity=".2" />
        <circle cx="152" cy="80" r="9" fill="#f43f5e" opacity=".85" /><circle cx="164" cy="80" r="9" fill="#f59e0b" opacity=".85" />
      </g>
      <g style={{ animation: 'float 5s ease-in-out infinite', animationDelay: '-2s' }}>
        <ellipse cx="34" cy="138" rx="20" ry="7" fill="#b45309" opacity=".5" />
        <rect x="14" y="124" width="40" height="14" fill="url(#hw-coin)" />
        <ellipse cx="34" cy="124" rx="20" ry="7" fill="#fde68a" />
        <text x="34" y="127.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#b45309">₹</text>
      </g>
      <g style={{ animation: 'float 7s ease-in-out infinite', animationDelay: '-1s' }}>
        <circle cx="196" cy="140" r="15" fill="url(#hw-coin)" />
        <circle cx="196" cy="140" r="10.5" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.5" />
        <text x="196" y="144.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#b45309">₹</text>
      </g>
      <g fill="#fff">
        <path d="M24 34l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" opacity=".9" />
        <path d="M200 26l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z" opacity=".75" />
        <circle cx="186" cy="56" r="2.5" opacity=".6" />
      </g>
    </svg>
  );
}

export function UploadArt({ className = '' }) {
  return (
    <svg viewBox="0 0 240 160" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ua-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#818cf8" /><stop offset="1" stopColor="#c084fc" /></linearGradient>
        <linearGradient id="ua-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#10b981" /></linearGradient>
      </defs>
      <ellipse cx="120" cy="146" rx="84" ry="8" fill="#6366f1" opacity=".08" />
      <g transform="rotate(-8 90 80)">
        <rect x="52" y="22" width="78" height="104" rx="10" fill="#fff" stroke="#e2e8f0" />
        <rect x="64" y="38" width="40" height="6" rx="3" fill="#cbd5e1" />
        {[54, 66, 78, 90, 102].map((y, i) => <g key={y}><rect x="64" y={y} width={[48, 38, 52, 30, 44][i]} height="5" rx="2.5" fill="#e2e8f0" /><rect x="116" y={y} width="8" height="5" rx="2.5" fill={i % 2 ? '#fda4af' : '#86efac'} /></g>)}
      </g>
      <g className="animate-float">
        <rect x="108" y="30" width="86" height="104" rx="12" fill="url(#ua-a)" />
        <rect x="120" y="44" width="40" height="6" rx="3" fill="#fff" opacity=".85" />
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={122 + i * 13} y={118 - [26, 44, 34, 56, 40][i]} width="8" height={[26, 44, 34, 56, 40][i]} rx="3" fill="#fff" opacity={0.55 + i * 0.08} />)}
      </g>
      <g style={{ animation: 'float 5s ease-in-out infinite', animationDelay: '-1.5s' }}>
        <circle cx="194" cy="36" r="20" fill="url(#ua-b)" />
        <path d="M194 46V27m-7 7l7-7 7 7" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function EmptyArt({ className = '' }) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden="true">
      <defs><linearGradient id="ea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a5b4fc" /><stop offset="1" stopColor="#f0abfc" /></linearGradient></defs>
      <ellipse cx="100" cy="128" rx="64" ry="7" fill="#6366f1" opacity=".08" />
      <path d="M60 24h70l14 14v80H60z" fill="#fff" stroke="#e2e8f0" />
      <path d="M130 24v14h14" fill="#f1f5f9" stroke="#e2e8f0" />
      {[46, 58, 70, 82].map((y, i) => <rect key={y} x="72" y={y} width={[52, 40, 56, 34][i]} height="5" rx="2.5" fill="#e2e8f0" />)}
      <g className="animate-float"><circle cx="138" cy="92" r="22" fill="none" stroke="url(#ea)" strokeWidth="7" /><path d="M154 108l16 16" stroke="url(#ea)" strokeWidth="9" strokeLinecap="round" /></g>
    </svg>
  );
}

export function AllGoodArt({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#059669" /></linearGradient></defs>
      <circle cx="60" cy="60" r="44" fill="#10b981" opacity=".1" />
      <path d="M60 18l34 12v26c0 22-15 38-34 46-19-8-34-24-34-46V30z" fill="url(#ag)" />
      <path d="M45 60l10 10 21-22" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g fill="#fbbf24"><path d="M100 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" /><path d="M18 80l1.6 3.6 3.6 1.6-3.6 1.6-1.6 3.6-1.6-3.6-3.6-1.6 3.6-1.6z" /></g>
    </svg>
  );
}

export function PiggyArt({ className = '' }) {
  return (
    <svg viewBox="0 0 140 120" className={className} aria-hidden="true">
      <defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f9a8d4" /><stop offset="1" stopColor="#ec4899" /></linearGradient>
        <linearGradient id="pc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fef3c7" /><stop offset="1" stopColor="#f59e0b" /></linearGradient></defs>
      <ellipse cx="70" cy="110" rx="44" ry="5" fill="#ec4899" opacity=".12" />
      <g className="animate-float">
        <circle cx="72" cy="20" r="11" fill="url(#pc)" /><text x="72" y="24.5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#b45309">₹</text>
      </g>
      <ellipse cx="68" cy="70" rx="44" ry="32" fill="url(#pg)" />
      <path d="M44 44l-6-14 16 8z" fill="#ec4899" />
      <rect x="40" y="92" width="11" height="14" rx="4" fill="#db2777" /><rect x="80" y="92" width="11" height="14" rx="4" fill="#db2777" />
      <ellipse cx="111" cy="70" rx="9" ry="11" fill="#f472b6" /><circle cx="109" cy="67" r="1.8" fill="#9d174d" /><circle cx="113" cy="73" r="1.8" fill="#9d174d" />
      <circle cx="90" cy="58" r="3.2" fill="#831843" />
      <rect x="60" y="40" width="18" height="4" rx="2" fill="#9d174d" opacity=".55" />
    </svg>
  );
}

/** Soft animated gradient blobs for page backgrounds. */
export function Blobs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-32 -top-32 h-[420px] w-[420px] animate-blob rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10" />
      <div className="absolute -right-24 top-40 h-[380px] w-[380px] animate-blob rounded-full bg-fuchsia-400/15 blur-3xl dark:bg-fuchsia-500/10" style={{ animationDelay: '-6s' }} />
      <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] animate-blob rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10" style={{ animationDelay: '-12s' }} />
    </div>
  );
}
