"use client";

import { useState } from "react";
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Calendar,
  ArrowUpRight,
  ExternalLink,
  BadgeCheck,
  ShieldCheck,
  Search
} from "lucide-react";

import { PageHeader } from "@/components/page/page-header";

type InvoiceMock = {
  id: string;
  projectName: string;
  client: string;
  milestoneTitle: string;
  amount: string;
  status: "paid" | "requested" | "pending";
  date: string;
  evidenceHash: string;
};

export default function FreelancerInvoicesPage() {
  const [filter, setFilter] = useState<"all" | "paid" | "requested">("all");

  const invoices: InvoiceMock[] = [
    {
      id: "INV-2026-001",
      projectName: "Customer portal MVP",
      client: "Crosslab",
      milestoneTitle: "Milestone 1: Project Setup & DB Schema",
      amount: "$2,400",
      status: "paid",
      date: "Aug 12, 2026",
      evidenceHash: "0x8fa3f2c99aeb"
    },
    {
      id: "INV-2026-002",
      projectName: "Customer portal MVP",
      client: "Crosslab",
      milestoneTitle: "Milestone 2: Sign-in & Authentication E2E Flow",
      amount: "$4,800",
      status: "requested",
      date: "Aug 13, 2026",
      evidenceHash: "0x4b99cd21da02"
    },
    {
      id: "INV-2026-003",
      projectName: "API Gateway Integration Suite",
      client: "ShopVibe",
      amount: "$8,500",
      milestoneTitle: "Milestone 1: Complete Endpoint Mapping & Gateway setup",
      status: "paid",
      date: "Jul 24, 2026",
      evidenceHash: "0x2da8f311cb99"
    }
  ];

  const filteredInvoices = invoices.filter(inv => {
    if (filter === "all") return true;
    return inv.status === filter;
  });

  const getStatusBadge = (status: InvoiceMock["status"]) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="size-3" /> Paid & Released
          </span>
        );
      case "requested":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-750 border border-brand-100 animate-pulse">
            <Clock className="size-3" /> Payout Requested
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500 border border-slate-200">
            Pending Approval
          </span>
        );
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <PageHeader
        eyebrow="Financial Records"
        title="Invoices & Evidence"
        description="Verify milestone payout histories, tax invoices, and locked QA evaluation certificates."
      />

      {/* Summary Widget Row */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="bg-white border border-slate-200 rounded-card p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-orange-400" />
          <span className="text-xs font-bold text-slate-400 block uppercase">Total Earnings Released</span>
          <span className="text-2xl font-black text-slate-900 block mt-2">$10,900</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Crosslab & ShopVibe projects</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-card p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-orange-400" />
          <span className="text-xs font-bold text-slate-400 block uppercase">Requested & Processing</span>
          <span className="text-2xl font-black text-slate-900 block mt-2">$4,800</span>
          <span className="text-[10px] text-brand-600 mt-1 block font-semibold">1 Invoice Pending Client approval</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-card p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-orange-400" />
          <span className="text-xs font-bold text-slate-400 block uppercase">Verified Evidence Packs</span>
          <span className="text-2xl font-black text-slate-900 block mt-2">2 Signed</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Locked compliance proofs on GitHub</span>
        </div>
      </div>

      {/* Invoices List Section */}
      <div className="mt-8 bg-white border border-slate-200 rounded-card shadow-sm overflow-hidden">
        {/* Table Header / Tabs */}
        <div className="border-b border-slate-150 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === "all" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-650 hover:bg-slate-100"
              }`}
            >
              All Invoices
            </button>
            <button
              onClick={() => setFilter("paid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === "paid" ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-650 hover:bg-slate-100"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilter("requested")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === "requested" ? "bg-brand-500 text-white" : "bg-slate-50 text-slate-650 hover:bg-slate-100"
              }`}
            >
              Requested
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">Showing {filteredInvoices.length} invoices</span>
        </div>

        {/* Invoice List Table */}
        <div className="divide-y divide-slate-100">
          {filteredInvoices.map((inv) => (
            <div key={inv.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors">
              <div className="space-y-1.5">
                <div className="flex items-center flex-wrap gap-2.5">
                  <span className="text-xs font-bold font-mono text-slate-400">{inv.id}</span>
                  {getStatusBadge(inv.status)}
                  <span className="text-xs font-semibold text-slate-450">{inv.date}</span>
                </div>
                <h3 className="text-base font-black text-slate-800">{inv.milestoneTitle}</h3>
                <p className="text-xs text-slate-500">
                  Client: <strong className="font-semibold text-slate-700">{inv.client}</strong> · Project: {inv.projectName}
                </p>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                  <BadgeCheck className="size-3.5 text-brand-500" />
                  <span>QA Compliance Evidence Hash: <strong className="text-slate-600">{inv.evidenceHash}</strong></span>
                </div>
              </div>

              {/* Action columns */}
              <div className="flex items-center gap-3 shrink-0 md:self-center self-start">
                <div className="text-left md:text-right pr-4 border-r border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Payout Amount</span>
                  <span className="text-lg font-black text-slate-900">{inv.amount}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control border border-slate-200 bg-white px-3.5 text-xs font-bold hover:bg-slate-50 text-slate-700 transition-all shadow-sm">
                    <Download className="size-3.5" /> PDF Invoice
                  </button>
                  {inv.status === "paid" && (
                    <button className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control bg-emerald-50 px-3.5 text-xs font-bold hover:bg-emerald-100 text-emerald-700 border border-emerald-150 transition-all shadow-sm">
                      <FileText className="size-3.5" /> Evidence Pack
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
