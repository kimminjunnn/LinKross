"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BrowserProvider, Contract, type Eip1193Provider, parseUnits } from "ethers";
import { AlertTriangle, ExternalLink, Loader2, Send, Wallet } from "lucide-react";

import { markCommissionChargePaidAction, verifyCommissionWalletPaymentAction } from "@/app/actions/commission";
import { paymentMethods } from "@/config/payment-method";
import {
  BASE_SEPOLIA_CHAIN_ID_HEX,
  BASE_SEPOLIA_EXPLORER_URL,
  BASE_SEPOLIA_NETWORK_PARAMS,
  LINKROSS_TREASURY_WALLET_ADDRESS,
  USDC_CONTRACT_ADDRESS,
  USDC_DECIMALS,
} from "@/config/testnet";
import type { CommissionChargeRecord, PaymentMethod } from "@/lib/backend";

const ERC20_TRANSFER_ABI = ["function transfer(address to, uint256 amount) returns (bool)"];

export function CommissionPaymentForm({ charge }: { charge: CommissionChargeRecord }) {
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (charge.status !== "pending") {
    return (
      <p className="mt-2 text-xs text-app-muted">
        {charge.status === "paid" && charge.paidAt ? `Paid ${new Date(charge.paidAt).toLocaleDateString("en-US")}` : "Waived"}
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <select
        value={method}
        onChange={(event) => setMethod(event.target.value as PaymentMethod)}
        className="min-h-10 w-full rounded-control border border-app-border-strong px-3 text-sm sm:w-auto"
      >
        {paymentMethods.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      {method === "wallet_testnet" ? (
        <CommissionWalletTransferPanel chargeId={charge.id} totalDue={charge.commissionAmount + charge.vatAmount} />
      ) : (
        <form
          action={(formData) => startTransition(async () => {
            const result = await markCommissionChargePaidAction({
              chargeId: charge.id,
              method: method as Exclude<PaymentMethod, "wallet_testnet">,
              paidReference: String(formData.get("paidReference") ?? ""),
            });
            setMessage(result.ok ? "Reported as paid." : result.error.message);
          })}
          className="grid gap-2 sm:grid-cols-[1fr_auto]"
        >
          <input
            name="paidReference"
            required
            disabled={pending}
            placeholder="Transfer memo or receipt number"
            className="min-h-10 rounded-control border border-app-border-strong px-3 text-sm disabled:opacity-50"
          />
          <button disabled={pending} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-50">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Report as paid
          </button>
          {message ? <p className="text-xs text-app-muted sm:col-span-2">{message}</p> : null}
        </form>
      )}
    </div>
  );
}

type TransferState =
  | { step: "idle" }
  | { step: "connecting" }
  | { step: "confirming" }
  | { step: "verifying"; txHash: string }
  | { step: "success"; txHash: string }
  | { step: "mismatch"; txHash: string; reason: string }
  | { step: "error"; message: string };

async function ensureBaseSepoliaNetwork(ethereum: Eip1193Provider) {
  const currentChainId = (await ethereum.request({ method: "eth_chainId" })) as string;
  if (currentChainId.toLowerCase() === BASE_SEPOLIA_CHAIN_ID_HEX) return;

  try {
    await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }] });
  } catch (switchError) {
    const code = (switchError as { code?: number })?.code;
    if (code === 4902) {
      await ethereum.request({ method: "wallet_addEthereumChain", params: [BASE_SEPOLIA_NETWORK_PARAMS] });
    } else {
      throw switchError;
    }
  }
}

function CommissionWalletTransferPanel({ chargeId, totalDue }: { chargeId: string; totalDue: number }) {
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

      const provider = new BrowserProvider(window.ethereum, "any");
      const signer = await provider.getSigner();
      const usdc = new Contract(USDC_CONTRACT_ADDRESS, ERC20_TRANSFER_ABI, signer);

      setState({ step: "confirming" });
      const amount = parseUnits(String(totalDue), USDC_DECIMALS);
      const tx = await usdc.transfer(LINKROSS_TREASURY_WALLET_ADDRESS, amount);
      await tx.wait();

      setState({ step: "verifying", txHash: tx.hash });
      const result = await verifyCommissionWalletPaymentAction({ chargeId, txHash: tx.hash });

      if (!result.ok) {
        setState({ step: "mismatch", txHash: tx.hash, reason: result.error.message });
      } else if (result.data.verified) {
        setState({ step: "success", txHash: tx.hash });
        router.refresh();
      } else {
        setState({ step: "mismatch", txHash: tx.hash, reason: result.data.reason ?? "지급 검증에 실패했습니다." });
      }
    } catch (error) {
      setState({ step: "error", message: error instanceof Error ? error.message : "지급 처리 중 오류가 발생했습니다." });
    }
  }

  if (state.step === "success" || state.step === "mismatch") {
    const txHash = state.txHash;
    return (
      <div className="flex flex-col items-start gap-1.5">
        <p className={`text-xs font-semibold ${state.step === "success" ? "text-accent-700" : "text-warning"}`}>
          {state.step === "success" ? "Paid · verified on-chain" : "Needs review"}
        </p>
        {state.step === "mismatch" ? <p className="max-w-xs text-xs text-warning">{state.reason}</p> : null}
        <a href={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
          View transaction<ExternalLink className="size-3.5" />
        </a>
        {state.step === "mismatch" && (
          <button type="button" onClick={() => setState({ step: "idle" })} className="text-xs font-semibold text-app-muted hover:underline">
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={handleTransfer}
        disabled={isBusy}
        className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
        {state.step === "connecting" ? "Connecting wallet" : state.step === "confirming" ? "Confirming transaction" : state.step === "verifying" ? "Verifying on-chain" : "Pay with wallet"}
      </button>
      <p className="text-xs text-app-muted">Base Sepolia testnet · {totalDue.toLocaleString()} USDC · no real value</p>
      {state.step === "error" ? (
        <p className="inline-flex max-w-xs items-start gap-1 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />{state.message}
        </p>
      ) : null}
    </div>
  );
}
