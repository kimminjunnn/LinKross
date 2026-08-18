import type { BudgetType } from "@/lib/backend/contracts";

export function formatBudget(
  amount: number,
  maxAmount: number | null,
  budgetType: BudgetType,
  currency: string,
) {
  const formattedAmount = formatCurrency(amount, currency);

  if (budgetType === "range" && maxAmount !== null) {
    return `${formattedAmount}–${formatCurrency(maxAmount, currency)}`;
  }

  return formattedAmount;
}

export function formatProjectDate(value: string, locale: string = "ko-KR") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(toDate(value));
}

export function formatProjectPeriod(startDate: string, endDate: string, locale: string = "ko-KR") {
  return `${formatProjectDate(startDate, locale)} – ${formatProjectDate(endDate, locale)}`;
}

export function technologyTags(technology: string | null) {
  if (!technology) return [];

  return technology
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-US")} ${currency}`;
  }
}

function toDate(value: string) {
  return new Date(value.includes("T") ? value : `${value}T00:00:00`);
}
