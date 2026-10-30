"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      <div className="border border-border-strong bg-bg-elevated p-6 max-w-md">
        <p className="font-mono text-xs font-bold text-accent-primary uppercase tracking-widest">
          SYS.DIAGNOSTICS // RUNTIME EXCEPTION
        </p>
        <h2 className="mt-2 font-display text-2xl text-text-primary uppercase">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          An unexpected error occurred while rendering the page telemetry.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="press-scale mt-5 inline-flex items-center gap-2 border border-accent-primary bg-accent-primary/10 px-4 py-2 font-mono text-xs font-semibold text-accent-primary hover:bg-accent-primary hover:text-white transition-colors uppercase tracking-wider"
        >
          [ RETRY INITIALIZATION ]
        </button>
      </div>
    </div>
  );
}

