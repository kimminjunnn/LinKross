"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTopButton({ className = "bottom-5" }: { className?: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      const nextIsVisible = window.scrollY > 480;
      setIsVisible((current) => (current === nextIsVisible ? current : nextIsVisible));
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!isVisible) return null;

  const handleScrollToTop = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      aria-label="화면 맨 위로 이동"
      className={`fixed right-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-full border border-app-border-strong bg-app-surface px-4 text-xs font-bold tracking-[0.08em] text-app-foreground shadow-floating transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:right-6 ${className}`}
    >
      <ArrowUp aria-hidden="true" className="size-4" />
      TOP
    </button>
  );
}
