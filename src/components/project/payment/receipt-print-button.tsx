"use client";

import { Printer } from "lucide-react";

export function ReceiptPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-control bg-app-foreground px-3 text-sm font-semibold text-white"
    >
      <Printer className="size-4" />
      PDF로 저장 / 인쇄
    </button>
  );
}
