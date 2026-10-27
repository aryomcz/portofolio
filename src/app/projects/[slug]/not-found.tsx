import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProjectNotFound() {
  return (
    <main className="mx-auto flex min-h-[75vh] max-w-7xl flex-col items-center justify-center border-x border-b border-border-subtle bg-bg-primary p-8 text-center">
      <p className="font-mono text-xs text-accent-primary">
        ERROR 404 // CASE STUDY NOT FOUND
      </p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight text-text-primary sm:text-4xl">
        Requested architectural report does not exist.
      </h1>
      <p className="mt-2 max-w-md text-sm text-text-secondary">
        The case study slug you requested could not be located in the portfolio
        registry.
      </p>
      <Link
        href="/"
        className="press-scale mt-6 inline-flex items-center gap-2 bg-text-primary px-5 py-2.5 font-mono text-xs font-medium text-bg-primary hover:bg-accent-primary hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Return to Portfolio Index</span>
      </Link>
    </main>
  );
}
