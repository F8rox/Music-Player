// Stroke icons in currentColor (no icon font or package). Purely decorative: the button
// carrying an icon always has its own aria-label.
const PATHS = {
  play: <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none" />,
  pause: <path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" fill="currentColor" stroke="none" />,
  prev: <path d="M18 5v14L8 12zM6 5v14" />,
  next: <path d="M6 5v14l10-7zM18 5v14" />,
  shuffle: <path d="M16 4h4v4M4 20 20 4M20 16v4h-4M15 15l5 5M4 4l5 5" />,
  repeat: <path d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4" />,
  queue: <path d="M4 6h12M4 12h12M4 18h8M18 14v6l4-3z" />,
  settings: <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
};

export const Icon = ({ name, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {PATHS[name]}
  </svg>
);
