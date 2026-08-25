"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useSidebarState } from "@/components/layout/sidebar-state";

export function DesktopSidebarHeader() {
  const { isCollapsed, toggleSidebar } = useSidebarState();
  const toggleLabel = isCollapsed ? "사이드바 펼치기" : "사이드바 접기";

  return (
    <div
      className={`relative hidden h-full shrink-0 items-center border-r border-app-border px-5 transition-[width] duration-200 motion-reduce:transition-none lg:flex ${
        isCollapsed
          ? "w-[var(--app-sidebar-collapsed-width)] justify-center px-0"
          : "w-[var(--app-sidebar-width)]"
      }`}
    >
      <Link
        href="/company"
        aria-label="기업 홈으로 이동"
        className="inline-flex shrink-0 items-center rounded-control"
      >
        <Image
          src={
            isCollapsed
              ? "/brand/linkross-symbol-on-light.svg"
              : "/brand/linkross-lockup-on-light.svg"
          }
          alt=""
          width={isCollapsed ? 70 : 312}
          height={70}
          className={isCollapsed ? "size-7" : "h-7 w-auto"}
          loading="eager"
          unoptimized
        />
      </Link>

      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={toggleLabel}
        aria-controls="desktop-sidebar"
        aria-expanded={!isCollapsed}
        title={toggleLabel}
        className={`absolute z-10 grid size-7 place-items-center rounded-control text-app-muted/70 transition-colors hover:bg-app-surface-subtle hover:text-app-foreground ${
          isCollapsed
            ? "-right-3.5 border border-app-border bg-app-surface"
            : "right-2"
        }`}
      >
        {isCollapsed ? (
          <ChevronRight aria-hidden="true" className="size-4" />
        ) : (
          <ChevronLeft aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  );
}
