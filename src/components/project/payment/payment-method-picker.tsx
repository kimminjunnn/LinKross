"use client";

import { CreditCard, Landmark, MoreHorizontal, Wallet, type LucideIcon } from "lucide-react";

import { paymentMethods } from "@/config/payment-method";
import type { PaymentMethod } from "@/lib/backend";

const METHOD_ICON: Record<PaymentMethod, LucideIcon> = {
  wallet_testnet: Wallet,
  bank_transfer: Landmark,
  card: CreditCard,
  other: MoreHorizontal,
};

const METHOD_TITLE: Record<"ko" | "en", Record<PaymentMethod, string>> = {
  ko: { wallet_testnet: "지갑 송금", bank_transfer: "계좌이체", card: "카드", other: "기타" },
  en: { wallet_testnet: "Wallet", bank_transfer: "Bank transfer", card: "Card", other: "Other" },
};

const METHOD_DESCRIPTION: Record<"ko" | "en", Record<PaymentMethod, string>> = {
  ko: { wallet_testnet: "Base 테스트넷 · 자동 검증", bank_transfer: "수동 확인", card: "수동 확인", other: "수동 확인" },
  en: { wallet_testnet: "Base testnet · auto-verified", bank_transfer: "Manual", card: "Manual", other: "Manual" },
};

export function PaymentMethodPicker({
  value,
  onChange,
  disabled = false,
  locale = "ko",
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
  locale?: "ko" | "en";
}) {
  return (
    <div role="radiogroup" aria-label={locale === "ko" ? "지급 수단" : "Payment method"} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {paymentMethods.map((option) => {
        const Icon = METHOD_ICON[option.value];
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-start gap-1.5 rounded-control border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                : "border-app-border-strong bg-app-surface hover:border-brand-300 hover:bg-app-surface-subtle"
            }`}
          >
            <Icon className={`size-4 ${selected ? "text-brand-600" : "text-app-muted"}`} />
            <span className={`text-sm font-semibold ${selected ? "text-brand-700" : "text-app-foreground"}`}>
              {METHOD_TITLE[locale][option.value]}
            </span>
            <span className="text-xs text-app-muted">{METHOD_DESCRIPTION[locale][option.value]}</span>
          </button>
        );
      })}
    </div>
  );
}
