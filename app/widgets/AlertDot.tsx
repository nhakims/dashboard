export function AlertDot({ onClear }: { onClear: () => void }) {
  return (
    <button onClick={onClear} className="mr-2 fc-70 hover:fc transition-colors shrink-0" title="Click to clear">
      <svg className="w-3 h-3 animate-nudge-right" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
