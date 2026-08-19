import { Interface, JsonRpcProvider, formatUnits, parseUnits } from "ethers";

import { BASE_SEPOLIA_RPC_URL, USDC_CONTRACT_ADDRESS, USDC_DECIMALS } from "@/config/testnet";

export const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const TRANSFER_EVENT_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
const transferInterface = new Interface(TRANSFER_EVENT_ABI);

export type OnchainVerifyResult =
  | { verified: true; txHash: string; blockNumber: number; toAddress: string; amountUsdc: string }
  | { verified: false; reason: string; blockNumber?: number; toAddress?: string };

/**
 * Base Sepolia에서 txHash의 영수증을 직접 조회해 USDC Transfer 이벤트를 대조한다.
 * 서버가 신뢰하는 값(마일스톤 합의 금액, 프리랜서 지갑 주소)만 기준으로 삼고 클라이언트 입력은 신뢰하지 않는다.
 */
export async function verifyOnchainTransfer(
  txHash: string,
  expectedAmountUsdc: string,
  expectedRecipientAddress: string,
): Promise<OnchainVerifyResult> {
  if (!TX_HASH_PATTERN.test(txHash)) {
    return { verified: false, reason: "트랜잭션 해시 형식이 올바르지 않습니다." };
  }

  const provider = new JsonRpcProvider(process.env.BASE_SEPOLIA_RPC ?? BASE_SEPOLIA_RPC_URL);

  let receipt;
  try {
    receipt = await provider.getTransactionReceipt(txHash);
  } catch {
    return { verified: false, reason: "온체인 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  if (!receipt) {
    return { verified: false, reason: "트랜잭션을 아직 찾을 수 없습니다. 블록 확정 후 다시 시도해주세요." };
  }

  if (receipt.status !== 1) {
    return { verified: false, reason: "트랜잭션이 실패했습니다.", blockNumber: receipt.blockNumber };
  }

  const expectedAmount = parseUnits(expectedAmountUsdc, USDC_DECIMALS);
  const usdcContractAddress = USDC_CONTRACT_ADDRESS.toLowerCase();

  let matchedTransfer: { to: string; value: bigint } | null = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== usdcContractAddress) continue;
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
    return { verified: false, reason: "USDC 전송(Transfer) 이벤트를 찾을 수 없습니다.", blockNumber: receipt.blockNumber };
  }

  if (matchedTransfer.to.toLowerCase() !== expectedRecipientAddress.toLowerCase()) {
    return {
      verified: false,
      reason: "수신 주소가 프리랜서의 등록된 지갑 주소와 일치하지 않습니다.",
      blockNumber: receipt.blockNumber,
      toAddress: matchedTransfer.to,
    };
  }

  if (matchedTransfer.value < expectedAmount) {
    return {
      verified: false,
      reason: `전송 금액(${formatUnits(matchedTransfer.value, USDC_DECIMALS)} USDC)이 합의 금액(${expectedAmountUsdc} USDC)보다 적습니다.`,
      blockNumber: receipt.blockNumber,
      toAddress: matchedTransfer.to,
    };
  }

  return {
    verified: true,
    txHash,
    blockNumber: receipt.blockNumber,
    toAddress: matchedTransfer.to,
    amountUsdc: formatUnits(matchedTransfer.value, USDC_DECIMALS),
  };
}
