"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  primaryNavigation,
  secondaryNavigation,
} from "@/config/navigation";

type NavigationItem = (typeof primaryNavigation)[number] | (typeof secondaryNavigation)[number];

type SidebarNavigationProps = {
  onNavigate?: () => void;
};

type NavigationLinkProps = {
  item: NavigationItem;
  isActive: boolean;
  onNavigate?: () => void;
};

function NavigationLink({
  item,
  isActive,
  onNavigate,
}: NavigationLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`group flex min-h-11 items-center gap-3 rounded-control px-3 py-2.5 text-sm font-semibold transition-colors ${
        isActive
          ? "bg-brand-50 text-brand-700"
          : "text-app-muted hover:bg-app-surface-subtle hover:text-app-foreground"
      }`}
    >
      <Icon
        aria-hidden="true"
        className={`size-[1.125rem] shrink-0 ${
          isActive
            ? "text-brand-500"
            : "text-app-muted group-hover:text-app-foreground"
        }`}
        strokeWidth={2}
      />
      <span>{item.label}</span>
      {isActive ? (
        <span
          aria-hidden="true"
          className="ml-auto h-5 w-1 rounded-pill bg-brand-500"
        />
      ) : null}
    </Link>
  );
}

function matchesPath(pathname: string, href: string) {
  return href === "/"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNavigation({ onNavigate }: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="주요 메뉴" className="flex flex-col gap-6">
      <div>
        <p className="px-3 text-[0.6875rem] font-bold tracking-[0.14em] text-app-muted uppercase">
          Workspace
        </p>
        <ul className="mt-2 space-y-1">
          {primaryNavigation.map((item) => (
            <li key={item.href}>
              <NavigationLink
                item={item}
                isActive={matchesPath(pathname, item.href)}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="px-3 text-[0.6875rem] font-bold tracking-[0.14em] text-app-muted uppercase">
          관리
        </p>
        <ul className="mt-2 space-y-1">
          {secondaryNavigation.map((item) => (
            <li key={item.href}>
              <NavigationLink
                item={item}
                isActive={matchesPath(pathname, item.href)}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
