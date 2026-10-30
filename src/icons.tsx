import type { CSSProperties } from "react";
export function Icon({
  name,
  size = 20,
  className = "",
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const paths: Record<string, React.ReactNode> = {
    logo: (
      <>
        <path d="m3 8 8-5 10 6-8 5z" />
        <path d="m3 13 10 6 8-5M3 18l10 6 8-5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14m-5-5 5 5-5 5" />
      </>
    ),
    left: (
      <>
        <path d="M19 12H5m5-5-5 5 5 5" />
      </>
    ),
    down: <path d="m6 9 6 6 6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    pin: (
      <>
        <path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    box: (
      <>
        <path d="m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10M7 5l10 4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    camera: (
      <>
        <path d="M8 5 6 8H3v12h18V8h-3l-2-3z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3m-3 0h6" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 7h7m4 0h5M4 17h3m4 0h9" />
        <circle cx="13" cy="7" r="2" />
        <circle cx="9" cy="17" r="2" />
      </>
    ),
    scale: (
      <>
        <path d="M12 3v17M6 21h12M4 7h16M6 7l-4 7h8zm12 0-4 7h8z" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10v.1" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    truck: (
      <>
        <path d="M2 5h12v12H2zM14 9h4l4 5v3h-8" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    cheese: (
      <>
        <path d="M3 11h18v10H3zM3 11l10-8 8 8" />
        <circle cx="8" cy="16" r="1" />
        <circle cx="16" cy="17" r="1.5" />
        <path d="m12 9 2 1" />
      </>
    ),
    wheat: (
      <>
        <path d="M12 22V7m0 5C5 12 5 6 5 6s7 0 7 6zm0 6c-7 0-7-6-7-6s7 0 7 6zm0-9c7 0 7-6 7-6s-7 0-7 6zm0 6c7 0 7-6 7-6s-7 0-7 6z" />
      </>
    ),
    wallet: (
      <>
        <path d="M21 8H4V4h14v4M4 8H3v12h18V8m0 5h-6v4h6" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H5v20h14V7zM14 2v6h5M8 12h8m-8 4h6" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 6 9 7 9-7" />
      </>
    ),
    phone: (
      <path d="m7 3 3 5-3 3c2 3 3 4 6 6l3-3 5 3c0 3-2 5-5 4C9 19 5 15 3 8 2 5 4 3 7 3Z" />
    ),
    note: (
      <>
        <path d="M14 3H4v18h16V9m-9 4 9-10 2 2-9 10-4 1zM7 18h6" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7m0-7L10 14M9 3H3v18h18v-6" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox={name === "logo" ? "0 0 26 28" : "0 0 24 24"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {paths[name] || paths.box}
    </svg>
  );
}
