export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page content"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary"
    >
      <div className="flex flex-col items-center gap-3 font-mono text-xs text-text-muted">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-subtle border-t-accent-primary" />
        <span className="tracking-widest uppercase">SYS.LOADING // INITIALIZING...</span>
      </div>
    </div>
  );
}

