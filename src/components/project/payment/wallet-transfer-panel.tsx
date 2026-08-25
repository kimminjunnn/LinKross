"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserProvider, Contract, type Eip1193Provider, parseUnits } from "ethers";
import { AlertTriangle, ExternalLink, Loader2, Wallet } from "lucide-react";

import { verifyWalletPaymentAction } from "@/app/actions/finance";
import { StatusBadge } from "@/components/project/status-badge";
import {
  BASE_SEPOLIA_CHAIN_ID_HEX,
  BASE_SEPOLIA_EXPLORER_URL,
  BASE_SEPOLIA_NETWORK_PARAMS,
  USDC_CONTRACT_ADDRESS,
  USDC_DECIMALS,
} from "@/config/testnet";

const ERC20_TRANSFER_ABI = ["function transfer(address to, uint256 amount) returns (bool)"];

type TransferState =
  | { step: "idle" }
  | { step: "connecting" }
  | { step: "confirming" }
  | { step: "verifying"; txHash: string }
  | { step: "success"; txHash: string }
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

export function WalletTransferPanel({
  projectId,
  paymentId,
  amountUsdc,
  recipientAddress,
}: {
  projectId: string;
  paymentId: string;
  amountUsdc: number;
  recipientAddress: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<TransferState>({ step: "idle" });
  const isBusy = state.step === "connecting" || state.step === "confirming" || state.step === "verifying";

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
      const amount = parseUnits(String(amountUsdc), USDC_DECIMALS);
      const tx = await usdc.transfer(recipientAddress, amount);
      await tx.wait();

      setState({ step: "verifying", txHash: tx.hash });
      const result = await verifyWalletPaymentAction({ projectId, paymentId, txHash: tx.hash });

      if (!result.ok) {
        setState({ step: "mismatch", txHash: tx.hash, reason: result.error.message });
      } else if (result.data.verified) {
        setState({ step: "success", txHash: tx.hash });
        router.refresh();
      } else {
        setState({ step: "mismatch", txHash: tx.hash, reason: result.data.reason ?? "지급 검증에 실패했습니다." });
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
      <div className="mt-3 flex flex-col items-start gap-2">
        {state.step === "success" ? (
          <StatusBadge tone="success">지급 완료 · 온체인 검증됨</StatusBadge>
        ) : (
          <StatusBadge tone="warning">확인 필요</StatusBadge>
        )}
        {state.step === "mismatch" ? <p className="max-w-xs text-xs font-bold text-warning">{state.reason}</p> : null}
        <a
          href={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline"
        >
          트랜잭션 확인
          <ExternalLink className="size-3.5" />
        </a>
        {state.step === "mismatch" && (
          <button type="button" onClick={() => setState({ step: "idle" })} className="text-xs font-bold text-app-muted hover:underline">
            다시 시도
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleTransfer}
        disabled={isBusy}
        className="primary-action inline-flex min-h-10 items-center gap-2 rounded-control px-4 text-sm font-bold"
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
      <p className="text-xs text-app-muted">Base Sepolia 테스트넷 · {amountUsdc.toLocaleString()} USDC · 실제 가치 없음</p>
      {state.step === "error" ? (
        <p className="inline-flex max-w-xs items-start gap-1 text-xs font-bold text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
