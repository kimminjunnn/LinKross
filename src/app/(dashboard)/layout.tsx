import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { OnboardingProfileSync } from "@/components/onboarding/onboarding-profile-sync";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-app-canvas">
      <OnboardingProfileSync />
      <AppHeader />
      <div className="mx-auto flex w-full max-w-[var(--app-max-width)] flex-1">
        <AppSidebar />
        <main
          id="main-content"
          className="flex min-w-0 flex-1 flex-col px-[var(--app-content-padding)] py-6 lg:py-8"
        >
          {children}
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
