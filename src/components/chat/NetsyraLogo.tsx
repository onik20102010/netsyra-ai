"use client";

/**
 * NetsyraLogo — space nebula gradient text logo.
 * Uses CSS background-clip: text to render a teal/cyan/navy/purple
 * gradient inside the letter shapes. Pure CSS, no images.
 *
 * Clickable: calls onClick to toggle the sidebar.
 * Responsive: shrinks on mobile, grows on desktop.
 */

interface NetsyraLogoProps {
  onClick?: () => void;
  size?: "sm" | "md";
  className?: string;
}

export default function NetsyraLogo({
  onClick,
  size = "sm",
  className = "",
}: NetsyraLogoProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Netsyra — toggle sidebar"
      className={`bg-transparent border-none p-0 m-0 cursor-pointer outline-none ${className}`}
    >
      <span className={`netsyra-logo netsyra-logo-${size}`} style={{ display: "inline-block" }}>
        Netsyra
      </span>
    </button>
  );
}
