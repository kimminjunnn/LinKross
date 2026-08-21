export function LinkrossLoadingMark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-flex ${className}`}>
      <svg viewBox="35 25 70 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
        <path d="M70 85L93 45" stroke="#F97316" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M47 75L70 35L93 75"
          stroke="#0F172A"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M47 45L70 85" stroke="#F97316" strokeWidth="12" strokeLinecap="round" />
      </svg>
    </span>
  );
}
