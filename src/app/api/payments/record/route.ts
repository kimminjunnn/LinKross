import { Interface, JsonRpcProvider, formatUnits, parseUnits } from "ethers";
import { NextResponse } from "next/server";

import { BASE_SEPOLIA_RPC_URL, USDC_CONTRACT_ADDRESS, USDC_DECIMALS } from "@/config/testnet";
import { getMilestonePayment } from "@/lib/milestones";
import { getAuthContext } from "@/lib/auth/workspace-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const TRANSFER_EVENT_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
const transferInterface = new Interface(TRANSFER_EVENT_ABI);

type VerifyResult = {
  verified: boolean;
  reason?: string;
  txHash?: string;
  blockNumber?: number;
  to?: string;
  amountUsdc?: string;
};

export async function POST(request: Request) {
  const authContext = await getAuthContext();
  if (authContext.configured && !authContext.userId) {
    return NextResponse.json(
      { verified: false, reason: "로그인이 필요합니다." },
      { status: 401 },
    );
  }
  if (authContext.configured && !authContext.roles.includes("company")) {
    return NextResponse.json(
      { verified: false, reason: "지급 기록 권한이 없습니다." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ verified: false, reason: "요청 본문이 올바른 JSON이 아닙니다." }, { status: 400 });
  }

  const { milestoneId, txHash } = (body ?? {}) as { milestoneId?: unknown; txHash?: unknown };

  if (typeof milestoneId !== "string" || typeof txHash !== "string") {
    return NextResponse.json({ verified: false, reason: "milestoneId와 txHash가 필요합니다." }, { status: 400 });
  }

  if (!TX_HASH_PATTERN.test(txHash)) {
    return NextResponse.json({ verified: false, reason: "트랜잭션 해시 형식이 올바르지 않습니다." }, { status: 400 });
  }

  // 마일스톤의 수신 주소·합의 금액은 클라이언트 입력이 아니라 서버가 아는 값만 신뢰한다.
  const milestone = getMilestonePayment(milestoneId);
  if (!milestone) {
    return NextResponse.json({ verified: false, reason: "알 수 없는 마일스톤입니다." }, { status: 404 });
  }

  const provider = new JsonRpcProvider(process.env.BASE_SEPOLIA_RPC ?? BASE_SEPOLIA_RPC_URL);

  let receipt;
  try {
    receipt = await provider.getTransactionReceipt(txHash);
  } catch {
    return NextResponse.json({ verified: false, reason: "온체인 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }

  if (!receipt) {
    return respond({ verified: false, reason: "트랜잭션을 아직 찾을 수 없습니다. 블록 확정 후 다시 시도해주세요.", txHash });
  }

  if (receipt.status !== 1) {
    return respond({ verified: false, reason: "트랜잭션이 실패했습니다.", txHash, blockNumber: receipt.blockNumber });
  }

  const expectedAmount = parseUnits(milestone.amountUsdc, USDC_DECIMALS);
  const usdcContractAddress = USDC_CONTRACT_ADDRESS.toLowerCase();

  let matchedTransfer: { to: string; value: bigint } | null = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== usdcContractAddress) {
      continue;
    }

    try {
      const parsed = transferInterface.parseLog(log);
      if (parsed?.name === "Transfer") {
        matchedTransfer = { to: parsed.args.to as string, value: parsed.args.value as bigint };
        break;
      }
    } catch {
      continue;
    }
  }

  if (!matchedTransfer) {
    return respond({ verified: false, reason: "USDC 전송(Transfer) 이벤트를 찾을 수 없습니다.", txHash, blockNumber: receipt.blockNumber });
  }

  if (matchedTransfer.to.toLowerCase() !== milestone.freelancerAddress.toLowerCase()) {
    return respond({
      verified: false,
      reason: "수신 주소가 마일스톤의 프리랜서 주소와 일치하지 않습니다.",
      txHash,
      blockNumber: receipt.blockNumber,
      to: matchedTransfer.to,
    });
  }

  if (matchedTransfer.value < expectedAmount) {
    return respond({
      verified: false,
      reason: `전송 금액(${formatUnits(matchedTransfer.value, USDC_DECIMALS)} USDC)이 합의 금액(${milestone.amountUsdc} USDC)보다 적습니다.`,
      txHash,
      blockNumber: receipt.blockNumber,
      to: matchedTransfer.to,
    });
  }

  const amountUsdc = formatUnits(matchedTransfer.value, USDC_DECIMALS);
  await recordVerifiedPayment({
    milestoneId,
    txHash,
    to: matchedTransfer.to,
    amountUsdc,
    blockNumber: receipt.blockNumber,
  });

  return respond({
    verified: true,
    txHash,
    blockNumber: receipt.blockNumber,
    to: matchedTransfer.to,
    amountUsdc,
  });
}

function respond(result: VerifyResult) {
  return NextResponse.json(result, { status: 200 });
}

async function recordVerifiedPayment(payment: {
  milestoneId: string;
  txHash: string;
  to: string;
  amountUsdc: string;
  blockNumber: number;
}) {
  // Supabase 미설정 환경에서도 검증 자체는 계속 동작해야 하므로 저장만 건너뛴다.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase.from("payments").insert({
    milestone_id: payment.milestoneId,
    tx_hash: payment.txHash,
    to_address: payment.to,
    amount_usdc: payment.amountUsdc,
    block_number: payment.blockNumber,
    verified_by: user.id,
  });

  // 23505 = unique_violation. 같은 tx를 다시 검증한 경우로, 정상적인 재요청이라 무시한다.
  if (error && error.code !== "23505") {
    console.error("[api/payments/record] payments insert 실패", error);
  }
}
