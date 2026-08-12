import Link from "next/link";

import { ReceiptDocument } from "@/components/project/payment/receipt-document";
import { ReceiptPrintButton } from "@/components/project/payment/receipt-print-button";
import { PROJECTS } from "@/data/projects";
import { getMilestonePayment, listMilestoneIds } from "@/lib/milestones";
import { getVerifiedPayment } from "@/lib/payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AllPaymentReceiptsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = PROJECTS.find((item) => item.id === projectId);

  const milestoneIds = listMilestoneIds();
  const entries = await Promise.all(
    milestoneIds.map(async (milestoneId) => ({
      milestoneId,
      milestone: getMilestonePayment(milestoneId)!,
      payment: await getVerifiedPayment(milestoneId),
    })),
  );
  const verifiedEntries = entries.filter(
    (entry): entry is typeof entry & { payment: NonNullable<typeof entry.payment> } => entry.payment !== null,
  );

  if (verifiedEntries.length === 0) {
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

      <div className="space-y-8">
        {verifiedEntries.map((entry, index) => (
          <div key={entry.milestoneId} className={index < verifiedEntries.length - 1 ? "break-after-page" : undefined}>
            <ReceiptDocument
              projectName={project?.name ?? projectId}
              assignee={project?.assignee ?? "-"}
              milestoneId={entry.milestoneId}
              milestone={entry.milestone}
              payment={entry.payment}
              recipientEmail={recipientEmail}
              issuedAt={issuedAt}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
