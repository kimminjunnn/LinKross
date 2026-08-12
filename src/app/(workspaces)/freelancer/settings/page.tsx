import { Bell, GitBranch, UserRound } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";

export default function FreelancerSettingsPage() {
  const settingCards = [
    {
      icon: UserRound,
      title: "Profile",
      description: "Name, headline, skills, time zone, and portfolio links.",
    },
    {
      icon: GitBranch,
      title: "GitHub",
      description:
        "Repository access and connection status for selected projects.",
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Selection, SOW approval, verification, and payment updates.",
    },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        eyebrow="Account"
        title="Profile and settings"
        description="Manage the information reused in applications, repository access, and important project notifications."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {settingCards.map((card) => {
          const Icon = card.icon;
          return (
          <section
            key={card.title}
            className="rounded-card border border-app-border bg-app-surface p-5 shadow-card"
          >
            <Icon className="size-5 text-brand-600" />
            <h2 className="mt-4 text-lg font-black">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-app-muted">
              {card.description}
            </p>
          </section>
          );
        })}
      </div>
    </div>
  );
}
