"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Search, 
  BriefcaseBusiness, 
  FolderKanban, 
  BadgeCheck, 
  Settings 
} from "lucide-react";

export function HeaderTabs() {
  const pathname = usePathname();

  const tabs = [
    { label: "Find projects", href: "/opportunities", icon: Search },
    { label: "My projects", href: "/freelancer/projects", icon: FolderKanban },
    { label: "Settings", href: "/freelancer/settings", icon: Settings },
  ];

  return (
    <nav className="hidden md:flex items-center gap-1.5 h-full ml-8">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              isActive 
                ? "bg-brand-50 text-brand-600 border border-brand-100/50 shadow-sm" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Icon className={`size-3.5 ${isActive ? "text-brand-500" : "text-slate-450"}`} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
