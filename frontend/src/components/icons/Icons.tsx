import type { SVGProps } from "react";

type IconName =
  | "logo"
  | "home"
  | "network"
  | "chat"
  | "search"
  | "plus"
  | "chevron-down"
  | "chevron-right"
  | "sun"
  | "moon"
  | "sparkles"
  | "file"
  | "folder"
  | "layers"
  | "cpu"
  | "database"
  | "bolt"
  | "arrow-up-right"
  | "copy"
  | "check"
  | "refresh"
  | "trash"
  | "external"
  | "close"
  | "send"
  | "loader"
  | "alert"
  | "clock"
  | "terminal"
  | "book"
  | "git"
  | "panel-left"
  | "history"
  | "github"
  | "arrow-left"
  | "code";

const paths: Record<IconName, React.ReactNode> = {
  logo: (
    <>
      <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" />
      <path d="M8 10.5 12 8l4 2.5v3L12 16l-4-2.5z" />
    </>
  ),
  home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  network: (
    <>
      <rect x="8" y="2" width="8" height="6" rx="1.5" />
      <rect x="2" y="16" width="8" height="6" rx="1.5" />
      <rect x="14" y="16" width="8" height="6" rx="1.5" />
      <path d="M12 8v4M6 16v-4h12v4" />
    </>
  ),
  chat: <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />,
  sparkles: (
    <>
      <path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      <path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </>
  ),
  folder: <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  layers: (
    <>
      <path d="m12 2 10 5-10 5L2 7z" />
      <path d="m2 12 10 5 10-5M2 17l10 5 10-5" />
    </>
  ),
  cpu: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 10-13h-7z" />,
  "arrow-up-right": <path d="M7 17 17 7M7 7h10v10" />,
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  refresh: <path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" />,
  trash: (
    <>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  external: <path d="M14 3h7v7M21 3l-9 9M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />,
  loader: <path d="M12 3a9 9 0 1 0 9 9" />,
  alert: (
    <>
      <path d="M10.3 3.7 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  terminal: <path d="m4 17 6-5-6-5M12 19h8" />,
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </>
  ),
  git: (
    <>
      <circle cx="6" cy="5" r="2" />
      <circle cx="18" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <path d="M6 7v10M18 7v2a4 4 0 0 1-4 4H8" />
    </>
  ),
  "panel-left": (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>
  ),
  github: (
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7.4A5.8 5.8 0 0 0 19.3 2.9 5.4 5.4 0 0 0 19.1 0S18 0 16 1.6a13.4 13.4 0 0 0-8 0C6 0 4.9 0 4.9 0a5.4 5.4 0 0 0-.2 2.9 5.8 5.8 0 0 0-1.6 4.2c0 5.8 3.5 7 6.8 7.4A4.8 4.8 0 0 0 9 18v4" />
  ),
  "arrow-left": <path d="M19 12H5M12 19l-7-7 7-7" />,
  code: <path d="m8 6-6 6 6 6M16 6l6 6-6 6" />
};

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.8,
  ...props
}: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

export type { IconName };
