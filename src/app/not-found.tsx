import { ArrowLeft } from "lucide-react";
import { GhostLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="page-shell flex flex-1 items-center">
      <div className="grid w-full gap-8 border-y border-ink/10 py-12 sm:grid-cols-[160px_1fr] sm:items-center">
        <p className="font-display text-7xl">404</p>
        <div>
          <p className="eyebrow">Page not found</p>
          <h1 className="mt-2 font-display text-4xl">
            This page is outside the edit.
          </h1>
          <p className="mt-3 text-sm text-ink/65">
            The address may have changed or the page is no longer available.
          </p>
          <GhostLink href="/" className="mt-6">
            <ArrowLeft className="h-4 w-4" />
            Back to MAII
          </GhostLink>
        </div>
      </div>
    </main>
  );
}
