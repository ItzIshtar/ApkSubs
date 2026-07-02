export function Illustration() {
  return (
    <svg
      className="illustration"
      viewBox="0 0 220 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="110" cy="152" rx="86" ry="10" fill="#E4E7F5" />

      {/* plant */}
      <rect x="16" y="118" width="26" height="26" rx="4" fill="#DCE0F2" />
      <path
        d="M29 118c0-14 -16-16-18-30 14 2 20 12 20 24"
        fill="#6FCF97"
      />
      <path
        d="M29 118c0-18 18-22 20-38 -16 2-22 14-22 28"
        fill="#8CD9AA"
      />

      {/* desk */}
      <rect x="46" y="120" width="140" height="8" rx="3" fill="#C9CEE8" />
      <rect x="52" y="128" width="6" height="24" rx="2" fill="#B7BCDE" />
      <rect x="170" y="128" width="6" height="24" rx="2" fill="#B7BCDE" />

      {/* laptop */}
      <rect x="92" y="96" width="46" height="30" rx="3" fill="#7C6EF2" />
      <rect x="96" y="100" width="38" height="20" rx="1.5" fill="#EDE9FF" />
      <path d="M86 126h60l4 8H82z" fill="#5B4CC4" />

      {/* person */}
      <circle cx="115" cy="46" r="16" fill="#FFC9A0" />
      <path
        d="M92 96c0-20 12-32 23-32s23 12 23 32z"
        fill="#7C6EF2"
      />
      <path d="M92 96h46l-3 12H95z" fill="#6A5CD8" />
      <rect x="98" y="70" width="12" height="18" rx="4" fill="#FFC9A0" />
      <rect x="120" y="70" width="12" height="18" rx="4" fill="#FFC9A0" />

      {/* chair */}
      <rect x="102" y="128" width="26" height="8" rx="3" fill="#F5A15A" />
      <rect x="106" y="136" width="4" height="14" rx="2" fill="#E88A3C" />
      <rect x="120" y="136" width="4" height="14" rx="2" fill="#E88A3C" />
    </svg>
  )
}
