"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApprovalSowSnapshot } from "@/lib/sow-approval";

export async function createSowApprovalAction(projectId: string, snapshot: ApprovalSowSnapshot) {
  const supabase = await createSupabaseServerClient();

  // For testing purposes, we assume 'company' approver_role and a dummy approver_id
  const dummyApproverId = "00000000-0000-0000-0000-000000000000";

  // First insert into sow_versions
  const { data: versionData, error: versionError } = await supabase
    .from("sow_versions")
    .insert([
      {
        project_id: projectId,
        status: "pending_approval",
        content: snapshot as unknown as any,
        content_hash: snapshot.version, // simple hash mock
      }
    ])
    .select("id")
    .single();

  if (versionError) {
    console.error("Failed to insert sow_version:", versionError);
    throw new Error(`Failed to insert SOW version: ${versionError.message}`);
  }

  const sowVersionId = versionData.id;

  // Insert into sow_approvals
  const { error: approvalError } = await supabase
    .from("sow_approvals")
    .insert([
      {
        sow_version_id: sowVersionId,
        approver_id: dummyApproverId,
        approver_role: "company",
        content_hash: snapshot.version,
      }
    ]);

  if (approvalError) {
    console.error("Failed to insert sow_approval:", approvalError);
    throw new Error(`Failed to create SOW approval: ${approvalError.message}`);
  }

  return { success: true, sowVersionId };
}

export async function getLatestSowApprovalAction(projectId: string): Promise<ApprovalSowSnapshot | null> {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("sow_versions")
    .select("content")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (error || !data) {
    return null;
  }
  
  return data.content as unknown as ApprovalSowSnapshot;
}
