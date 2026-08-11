"use client";

import { useState } from "react";
import { BrowserProvider, Contract, type Eip1193Provider, parseUnits } from "ethers";
import { ExternalLink, Loader2, Wallet } from "lucide-react";

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
  | { step: "success"; txHash: string }
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
  freelancerAddress,
  amountUsdc,
}: {
  freelancerAddress: string;
  amountUsdc: string;
}) {
  const [state, setState] = useState<TransferState>({ step: "idle" });
  const isBusy = state.step === "connecting" || state.step === "confirming";

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
      const amount = parseUnits(amountUsdc, USDC_DECIMALS);
      const tx = await usdc.transfer(freelancerAddress, amount);
      await tx.wait();

      setState({ step: "success", txHash: tx.hash });
    } catch (error) {
      setState({
        step: "error",
        message: error instanceof Error ? error.message : "지급 처리 중 오류가 발생했습니다.",
      });
    }
  }

  if (state.step === "success") {
    return (
      <div className="mt-4 flex flex-col items-start gap-2 sm:mt-0 sm:items-end">
        <StatusBadge tone="success">지급 완료</StatusBadge>
        <a
          href={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${state.txHash}`}
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
        {state.step === "connecting" ? "지갑 연결 중" : state.step === "confirming" ? "트랜잭션 확인 중" : "지갑으로 지급"}
      </button>
      <p className="text-xs text-app-muted">Base Sepolia 테스트넷 · {amountUsdc} USDC · 실제 가치 없음</p>
      {state.step === "error" ? <p className="text-xs font-bold text-warning">{state.message}</p> : null}
    </div>
  );
}
