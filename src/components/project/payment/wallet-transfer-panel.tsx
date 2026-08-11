"use client";

import { useState } from "react";
import { BrowserProvider, Contract, type Eip1193Provider, parseUnits } from "ethers";
import { AlertTriangle, ExternalLink, Loader2, Wallet } from "lucide-react";

import { StatusBadge } from "@/components/project/status-badge";
import {
  BASE_SEPOLIA_CHAIN_ID_HEX,
  BASE_SEPOLIA_EXPLORER_URL,
  BASE_SEPOLIA_NETWORK_PARAMS,
  USDC_CONTRACT_ADDRESS,
  USDC_DECIMALS,
} from "@/config/testnet";
import { getMilestonePayment } from "@/lib/milestones";

const ERC20_TRANSFER_ABI = ["function transfer(address to, uint256 amount) returns (bool)"];

type TransferState =
  | { step: "idle" }
  | { step: "connecting" }
  | { step: "confirming" }
  | { step: "verifying"; txHash: string }
  | { step: "success"; txHash: string; amountUsdc: string }
  | { step: "mismatch"; txHash: string; reason: string }
  | { step: "error"; message: string };

// ethers의 BrowserProvider는 생성 시점의 네트워크를 고정으로 가정하므로,
// provider를 만들기 전에 지갑 네트워크 전환을 먼저 끝내야 한다.
// 그렇지 않으면 전송이 성공해도 "network changed" NETWORK_ERROR가 발생한다.
async function ensureBaseSepoliaNetwork(ethereum: Eip1193Provider) {
  const currentChainId = (await ethereum.request({ method: "eth_chainId" })) as string;
  if (currentChainId.toLowerCase() === BASE_SEPOLIA_CHAIN_ID_HEX) {
    return;
  }

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (switchError) {
    const code = (switchError as { code?: number })?.code;
    if (code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [BASE_SEPOLIA_NETWORK_PARAMS],
      });
    } else {
      throw switchError;
    }
  }
}

type VerifyResponse = {
  verified: boolean;
  reason?: string;
  amountUsdc?: string;
};

async function verifyPayment(milestoneId: string, txHash: string): Promise<VerifyResponse> {
  const response = await fetch("/api/payments/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ milestoneId, txHash }),
  });

  const data = (await response.json()) as VerifyResponse;
  if (!response.ok && response.status !== 200) {
    return { verified: false, reason: data.reason ?? "서버 검증 요청이 실패했습니다." };
  }

  return data;
}

export function WalletTransferPanel({ milestoneId }: { milestoneId: string }) {
  const [state, setState] = useState<TransferState>({ step: "idle" });
  const isBusy = state.step === "connecting" || state.step === "confirming" || state.step === "verifying";

  const milestone = getMilestonePayment(milestoneId);
  if (!milestone) {
    return <p className="text-xs font-bold text-warning">알 수 없는 마일스톤입니다 ({milestoneId}).</p>;
  }

  async function handleTransfer() {
    if (typeof window === "undefined" || !window.ethereum) {
      setState({ step: "error", message: "MetaMask를 찾을 수 없습니다. 브라우저 확장 프로그램을 설치해주세요." });
      return;
    }

    try {
      setState({ step: "connecting" });
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await ensureBaseSepoliaNetwork(window.ethereum);

      // network: "any" — 위에서 전환한 네트워크를 provider가 이후에도 계속 재감지하도록 허용한다.
      const provider = new BrowserProvider(window.ethereum, "any");
      const signer = await provider.getSigner();
      const usdc = new Contract(USDC_CONTRACT_ADDRESS, ERC20_TRANSFER_ABI, signer);

      setState({ step: "confirming" });
      const amount = parseUnits(milestone!.amountUsdc, USDC_DECIMALS);
      const tx = await usdc.transfer(milestone!.freelancerAddress, amount);
      await tx.wait();

      setState({ step: "verifying", txHash: tx.hash });
      const result = await verifyPayment(milestoneId, tx.hash);

      if (result.verified) {
        setState({ step: "success", txHash: tx.hash, amountUsdc: result.amountUsdc ?? milestone!.amountUsdc });
      } else {
        setState({ step: "mismatch", txHash: tx.hash, reason: result.reason ?? "지급 검증에 실패했습니다." });
      }
    } catch (error) {
      setState({
        step: "error",
        message: error instanceof Error ? error.message : "지급 처리 중 오류가 발생했습니다.",
      });
    }
  }

  if (state.step === "success" || state.step === "mismatch") {
    const txHash = state.txHash;
    return (
      <div className="mt-4 flex flex-col items-start gap-2 sm:mt-0 sm:items-end">
        {state.step === "success" ? (
          <StatusBadge tone="success">지급 완료 · {state.amountUsdc} USDC 확인됨</StatusBadge>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <StatusBadge tone="warning">확인 필요</StatusBadge>
          </span>
        )}
        {state.step === "mismatch" ? <p className="max-w-xs text-right text-xs font-bold text-warning">{state.reason}</p> : null}
        <a
          href={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline"
        >
          트랜잭션 확인
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-2 sm:mt-0 sm:items-end">
      <button
        type="button"
        onClick={handleTransfer}
        disabled={isBusy}
        className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-bold text-white disabled:opacity-60"
      >
        {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
        {state.step === "connecting"
          ? "지갑 연결 중"
          : state.step === "confirming"
            ? "트랜잭션 확인 중"
            : state.step === "verifying"
              ? "온체인 검증 중"
              : "지갑으로 지급"}
      </button>
      <p className="text-xs text-app-muted">Base Sepolia 테스트넷 · {milestone.amountUsdc} USDC · 실제 가치 없음</p>
      {state.step === "error" ? (
        <p className="inline-flex max-w-xs items-start gap-1 text-right text-xs font-bold text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
