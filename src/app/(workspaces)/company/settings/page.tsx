import { PageHeader } from "@/components/page/page-header";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader title="설정" description="워크스페이스, GitHub 연동과 알림 기본값을 관리하는 팀 작업 영역입니다." />
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {["워크스페이스", "GitHub 연동", "알림", "멤버 및 권한"].map((item) => (
          <section key={item} className="rounded-card border border-app-border bg-app-surface p-5 shadow-card">
            <h2 className="font-black text-app-foreground">{item}</h2>
            <p className="mt-2 text-sm leading-6 text-app-muted">담당 팀원이 기능을 구현할 수 있도록 확보한 라우트입니다.</p>
          </section>
        ))}
      </div>
    </div>
  );
}
