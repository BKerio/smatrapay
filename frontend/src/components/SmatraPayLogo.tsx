// src/components/SmatraPayLogo.tsx
import React from "react";

interface SmatraPayLogoProps {
  className?: string;
  /** Accepted for backward compatibility with older call sites; the mark doesn't change on scroll. */
  isScrolled?: boolean;
  /** Accepted for backward compatibility with older call sites; sizing is controlled via className. */
  size?: string;
}

const ORANGE = "#C1590E";
const TEAL = "#12A6B4";

/**
 * SmatraPay wordmark: a two-tone diamond mark (orange "S" tile overlapping a
 * teal chevron tile) followed by the "Smatra" / "Pay" wordmark.
 */
const SmatraPayLogo: React.FC<SmatraPayLogoProps> = ({ className = "" }) => {
  return (
    <svg
      viewBox="0 0 440 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-full w-auto ${className}`}
      role="img"
      aria-label="SmatraPay"
    >
      {/* Icon mark */}
      <g>
        {/* Teal chevron tile, offset to the right and partially behind the orange tile */}
        <g transform="translate(60,50) rotate(45)">
          <rect x="-30" y="-30" width="60" height="60" rx="14" fill={TEAL} />
        </g>

        {/* Orange tile with the "S" ribbon, drawn on top */}
        <g transform="translate(34,50) rotate(45)">
          <rect x="-32" y="-32" width="64" height="64" rx="15" fill={ORANGE} />
        </g>
        <path
          d="M28 34 Q17 34 17 43 Q17 50 28 50 Q39 50 39 57 Q39 66 28 66"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Wordmark */}
      <text
        x="112"
        y="68"
        style={{
          fontFamily: "'Poppins', 'Inter', 'Outfit', sans-serif",
          fontSize: "56px",
          fontWeight: 800,
          letterSpacing: "-0.01em",
        }}
      >
        <tspan fill={ORANGE}>Smatra</tspan>
        <tspan fill={TEAL}>Pay</tspan>
      </text>
    </svg>
  );
};

export default SmatraPayLogo;
