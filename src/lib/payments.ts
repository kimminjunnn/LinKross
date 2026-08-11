import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface VerifiedPayment {
  milestoneId: string;
  txHash: string;
  toAddress: string;
  amountUsdc: string;
  blockNumber: number;
  verifiedAt: string;
}

export async function getVerifiedPayment(milestoneId: string): Promise<VerifiedPayment | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("milestone_id, tx_hash, to_address, amount_usdc, block_number, verified_at")
    .eq("milestone_id", milestoneId)
    .order("verified_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    milestoneId: data.milestone_id,
    txHash: data.tx_hash,
    toAddress: data.to_address,
    amountUsdc: String(data.amount_usdc),
    blockNumber: data.block_number,
    verifiedAt: data.verified_at,
  };
}
