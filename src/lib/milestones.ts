import { DEMO_FREELANCER_ADDRESS } from "@/config/testnet";

export interface MilestonePayment {
  milestoneId: string;
  freelancerAddress: string;
  // 테스트넷 지갑 보유 잔액 제약으로 실제 데모 전송액은 SOW 합의 금액(예: 1,000 USDC)과 다르다.
  amountUsdc: string;
}

const MILESTONE_PAYMENTS: Record<string, MilestonePayment> = {
  M1: {
    milestoneId: "M1",
    freelancerAddress: DEMO_FREELANCER_ADDRESS,
    amountUsdc: "1",
  },
};

export function getMilestonePayment(milestoneId: string): MilestonePayment | undefined {
  return MILESTONE_PAYMENTS[milestoneId];
}
