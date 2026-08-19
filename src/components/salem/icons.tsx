/**
 * Local stand-in for lucide-react's `Instagram` icon.
 *
 * The pinned lucide-react version in this project does not export an
 * `Instagram` icon, which broke the production build (import of a
 * non-existent named export). Rather than pin/upgrade the dependency,
 * this renders the same glyph locally, styled to match the other
 * lucide icons used alongside it (24x24 viewbox, stroke-based, currentColor).
 */
export function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
