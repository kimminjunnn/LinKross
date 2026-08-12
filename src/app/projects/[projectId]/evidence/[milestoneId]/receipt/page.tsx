import Link from "next/link";

import { ReceiptDocument } from "@/components/project/payment/receipt-document";
import { ReceiptPrintButton } from "@/components/project/payment/receipt-print-button";
import { PROJECTS } from "@/data/projects";
import { getMilestonePayment } from "@/lib/milestones";
import { getVerifiedPayment } from "@/lib/payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ projectId: string; milestoneId: string }>;
}) {
  const { projectId, milestoneId } = await params;

  const project = PROJECTS.find((item) => item.id === projectId);
  const milestone = getMilestonePayment(milestoneId);
  const payment = await getVerifiedPayment(milestoneId);

  if (!milestone || !payment) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm font-bold text-app-foreground">아직 검증된 지급 기록이 없습니다.</p>
        <p className="mt-2 text-sm text-app-muted">온체인 검증이 완료된 이후에 영수증을 발급할 수 있습니다.</p>
        <Link href={`/projects/${projectId}/evidence`} className="mt-4 inline-block text-sm font-bold text-brand-700 hover:underline">
          증빙 화면으로 돌아가기
        </Link>
      </div>
    );
  }

  const issuedAt = new Date().toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const recipientEmail = user?.email ?? "-";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/projects/${projectId}/evidence`} className="text-sm font-bold text-app-muted hover:text-app-foreground">
          ← 증빙 화면으로
        </Link>
        <ReceiptPrintButton />
      </div>

      <ReceiptDocument
        projectName={project?.name ?? projectId}
        assignee={project?.assignee ?? "-"}
        milestoneId={milestoneId}
        milestone={milestone}
        payment={payment}
        recipientEmail={recipientEmail}
        issuedAt={issuedAt}
      />
    </div>
  );
}
