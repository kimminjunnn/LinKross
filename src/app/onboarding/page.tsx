import type { Metadata } from "next";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "시작하기 | LinKross",
  description: "프로젝트를 등록하거나 모집 중인 프로젝트에 지원하세요.",
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
