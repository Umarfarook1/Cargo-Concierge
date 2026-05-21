"use client";

export function RouteGraphic({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 720 200"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <radialGradient id="dot-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="80" cy="148" r="18" fill="url(#dot-glow)" />
      <circle cx="640" cy="60" r="22" fill="url(#dot-glow)" />

      <path
        d="M 80 148 Q 360 -40 640 60"
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        opacity="0.35"
      />

      <path
        d="M 80 148 Q 360 -40 640 60"
        stroke="var(--amber)"
        strokeWidth="2"
        className="route-arc"
        style={{ ["--len" as string]: "900" }}
        strokeDasharray="900"
      />

      <g>
        <circle cx="80" cy="148" r="5" fill="var(--ink)" />
        <circle cx="80" cy="148" r="2" fill="var(--paper)" />
      </g>

      <g>
        <circle cx="640" cy="60" r="5" fill="var(--amber)" />
        <circle cx="640" cy="60" r="2" fill="var(--paper)" />
      </g>

      <text
        x="80"
        y="178"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--ink-mute)"
        letterSpacing="0.1em"
      >
        BLR
      </text>
      <text
        x="640"
        y="38"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--ink-mute)"
        letterSpacing="0.1em"
      >
        FRA
      </text>
    </svg>
  );
}
