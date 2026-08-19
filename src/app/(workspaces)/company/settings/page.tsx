import { CircleAlert } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { getCompanyProfileSettings } from "@/lib/backend";

import { CompanyProfileForm } from "./profile-form";

export default async function SettingsPage() {
  const result = await getCompanyProfileSettings();
  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader title="설정" description="프로젝트와 제안서에 표시되는 기업 담당자 정보를 관리합니다." />
      {!result.ok ? <div className="mt-7 flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-sm text-danger"><CircleAlert className="size-5 shrink-0" />{result.error.message}</div> : <CompanyProfileForm initialProfile={result.data} />}
      <section className="mt-5 rounded-card border border-app-border bg-app-surface p-5 shadow-card">
        <h2 className="font-semibold text-app-foreground">외부 연동</h2>
        <p className="mt-2 text-sm leading-6 text-app-muted">GitHub 저장소는 프로젝트별 검수 화면에서 연결합니다. 전역 알림 설정과 멤버 초대는 아직 데이터 모델과 발송 서비스가 없어 제공하지 않습니다.</p>
      </section>
    </div>
  );
}
