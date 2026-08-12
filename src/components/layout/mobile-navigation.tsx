"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { SidebarNavigation } from "@/components/layout/sidebar-navigation";
import {
  workspaceNavigation,
  type WorkspaceRole,
} from "@/config/navigation";

const mobileCopy = {
  company: {
    open: "메뉴 열기",
    close: "메뉴 닫기",
    dialog: "모바일 메뉴",
    footer: "사람을 고르고, 일을 합의하고, 결과물을 검증합니다.",
  },
  freelancer: {
    open: "Open menu",
    close: "Close menu",
    dialog: "Mobile navigation",
    footer: "Choose the work. Agree on the scope. Prove the result.",
  },
} as const;

export function MobileNavigation({ workspace }: { workspace: WorkspaceRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements.item(0);
      const lastElement = focusableElements.item(focusableElements.length - 1);

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  const copy = mobileCopy[workspace];

  return (
    <>
      <button
        type="button"
        className="grid size-10 place-items-center rounded-control text-app-muted hover:bg-app-surface-subtle hover:text-app-foreground lg:hidden"
        aria-label={copy.open}
        aria-controls="mobile-navigation-panel"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={copy.close}
            className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[2px]"
            onClick={closeMenu}
          />
          <aside
            ref={panelRef}
            id="mobile-navigation-panel"
            role="dialog"
            aria-modal="true"
            aria-label={copy.dialog}
            className="relative flex h-full w-[min(86vw,20rem)] flex-col bg-app-surface shadow-floating"
          >
            <div className="flex h-[var(--app-header-height)] items-center justify-between border-b border-app-border px-4">
              <BrandLogo
                ariaLabel={
                  workspace === "freelancer"
                    ? "Go to freelancer home"
                    : "기업 홈으로 이동"
                }
                href={workspace === "freelancer" ? "/freelancer" : "/company"}
              />
              <button
                ref={closeButtonRef}
                type="button"
                className="grid size-10 place-items-center rounded-control text-app-muted hover:bg-app-surface-subtle hover:text-app-foreground"
                aria-label={copy.close}
                onClick={closeMenu}
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <SidebarNavigation
                sections={workspaceNavigation[workspace]}
                ariaLabel={copy.dialog}
                onNavigate={closeMenu}
              />
            </div>
            <div className="border-t border-app-border p-4 text-xs leading-5 text-app-muted">
              {copy.footer}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
