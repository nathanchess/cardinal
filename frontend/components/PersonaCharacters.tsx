/** Duolingo-style flat geometric persona characters. */

type CharacterProps = {
  className?: string;
};

export function MayaDinerCharacter({ className }: CharacterProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <circle cx="60" cy="60" r="58" fill="#FFF1E8" />
      {/* hair */}
      <ellipse cx="60" cy="42" rx="34" ry="28" fill="#2B2118" />
      <rect x="26" y="42" width="68" height="28" rx="14" fill="#2B2118" />
      {/* face */}
      <ellipse cx="60" cy="52" rx="24" ry="22" fill="#F0C9A8" />
      {/* eyes */}
      <circle cx="51" cy="50" r="5.5" fill="#fff" />
      <circle cx="69" cy="50" r="5.5" fill="#fff" />
      <circle cx="52.5" cy="51" r="2.4" fill="#1A1A1A" />
      <circle cx="70.5" cy="51" r="2.4" fill="#1A1A1A" />
      {/* smile */}
      <path
        d="M52 60c3.5 4 12.5 4 16 0"
        fill="none"
        stroke="#C47A5A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* body / apron vibe */}
      <path
        d="M34 88c4-14 18-20 26-20s22 6 26 20v18H34V88z"
        fill="#E85D4C"
      />
      <rect x="48" y="78" width="24" height="28" rx="4" fill="#FFE8A3" />
      {/* coffee cup */}
      <rect x="86" y="70" width="16" height="20" rx="3" fill="#fff" />
      <rect x="88" y="72" width="12" height="8" rx="2" fill="#6B3F2A" />
      <path
        d="M102 74h4c3 0 5 2 5 5s-2 5-5 5h-4"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M90 66c2-3 4-3 6 0M94 64c2-3 4-3 6 0"
        fill="none"
        stroke="#B8B8B2"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function JordanCashbackCharacter({ className }: CharacterProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <circle cx="60" cy="60" r="58" fill="#EAF6EF" />
      {/* hair */}
      <path
        d="M32 48c2-20 20-30 28-30s26 10 28 30c-8-6-18-8-28-8s-20 2-28 8z"
        fill="#1C1C1A"
      />
      {/* face */}
      <ellipse cx="60" cy="54" rx="23" ry="21" fill="#D4A574" />
      {/* eyes */}
      <circle cx="51" cy="52" r="5.5" fill="#fff" />
      <circle cx="69" cy="52" r="5.5" fill="#fff" />
      <circle cx="52.2" cy="53" r="2.4" fill="#1A1A1A" />
      <circle cx="70.2" cy="53" r="2.4" fill="#1A1A1A" />
      <path
        d="M52 62c3.2 3.5 12.8 3.5 16 0"
        fill="none"
        stroke="#A56B3C"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* hoodie */}
      <path
        d="M30 90c6-16 20-24 30-24s24 8 30 24v16H30V90z"
        fill="#3D9A5F"
      />
      <path d="M48 70c4-8 20-8 24 0l-4 8H52l-4-8z" fill="#2F7A4A" />
      {/* shopping bag */}
      <rect x="88" y="72" width="20" height="24" rx="3" fill="#2383E2" />
      <path
        d="M92 72v-6c0-4 3-7 6-7s6 3 6 7v6"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <text
        x="98"
        y="88"
        textAnchor="middle"
        fill="#fff"
        fontSize="10"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        $
      </text>
    </svg>
  );
}

export function PriyaFlyerCharacter({ className }: CharacterProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <circle cx="60" cy="60" r="58" fill="#E8F1FB" />
      {/* hair */}
      <ellipse cx="60" cy="40" rx="30" ry="24" fill="#1A1410" />
      <path d="M30 48c0 18 8 28 30 28s30-10 30-28H30z" fill="#1A1410" />
      {/* face */}
      <ellipse cx="60" cy="52" rx="22" ry="20" fill="#C6865A" />
      {/* eyes */}
      <circle cx="52" cy="50" r="5.2" fill="#fff" />
      <circle cx="68" cy="50" r="5.2" fill="#fff" />
      <circle cx="53.2" cy="51" r="2.3" fill="#1A1A1A" />
      <circle cx="69.2" cy="51" r="2.3" fill="#1A1A1A" />
      <path
        d="M53 60c2.8 3.2 11.2 3.2 14 0"
        fill="none"
        stroke="#8B4E2F"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* scarf / travel jacket */}
      <path
        d="M34 88c5-14 17-20 26-20s21 6 26 20v18H34V88z"
        fill="#1B6BC4"
      />
      <path d="M44 74h32l-4 10H48l-4-10z" fill="#E85D4C" />
      {/* suitcase */}
      <rect x="84" y="78" width="24" height="20" rx="3" fill="#5B4FCF" />
      <rect x="90" y="74" width="12" height="5" rx="1.5" fill="#2B2118" />
      <line
        x1="96"
        y1="78"
        x2="96"
        y2="98"
        stroke="#fff"
        strokeWidth="2"
        opacity="0.5"
      />
      {/* tiny plane */}
      <path
        d="M18 36l14 4-4 3 8 2-2 3-8-3 2 6-4-1-4-8 2-2-4-4z"
        fill="#1B6BC4"
      />
    </svg>
  );
}

export function CustomProfileCharacter({ className }: CharacterProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <circle cx="60" cy="60" r="58" fill="#F4F4F1" />
      <circle cx="60" cy="46" r="18" fill="#D8D8D2" />
      <path
        d="M28 96c4-20 20-30 32-30s28 10 32 30"
        fill="#D8D8D2"
      />
      <circle cx="60" cy="60" r="22" fill="none" stroke="#111" strokeWidth="3" />
      <path
        d="M60 48v24M48 60h24"
        stroke="#111"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PersonaCharacter({
  personaId,
  className,
}: {
  personaId: string;
  className?: string;
}) {
  switch (personaId) {
    case "urban_diner":
      return <MayaDinerCharacter className={className} />;
    case "no_fee_cashback":
      return <JordanCashbackCharacter className={className} />;
    case "delta_premium_flyer":
      return <PriyaFlyerCharacter className={className} />;
    default:
      return <CustomProfileCharacter className={className} />;
  }
}
