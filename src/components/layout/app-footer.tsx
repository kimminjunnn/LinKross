export function AppFooter() {
  return (
    <footer className="border-t border-app-border bg-app-surface print:hidden">
      <div className="mx-auto flex min-h-16 w-full max-w-[var(--app-max-width)] flex-col justify-center gap-1 px-[var(--app-content-padding)] py-4 text-xs text-app-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 LinKross · Passion Five</p>
        <p>Verify talent. Define the work. Prove it works.</p>
      </div>
    </footer>
  );
}
