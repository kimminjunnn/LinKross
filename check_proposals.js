const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pehcdvjmesolzahigpgg.supabase.co';
const supabaseKey = 'sb_publishable_qUep1D88_00DPX0nSWb_fg_nbEpYc3p'; // Public anon

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking project status...");
  const { data: project, error: pError } = await supabase
    .from('projects')
    .select('id, status, current_requirement_version_id')
    .eq('id', '0ed0b64e-0fe3-4cf6-9b38-a95af68463da')
    .single();
    
  if (pError) {
    console.error("Project Error:", pError);
    return;
  }
  
  console.log("Project:", project);
  
  if (project && project.current_requirement_version_id) {
    const { data: version, error: vError } = await supabase
      .from('project_requirement_versions')
      .select('title, recruitment_start_at, recruitment_end_at')
      .eq('id', project.current_requirement_version_id)
      .single();
      
    if (vError) {
      console.error("Version Error:", vError);
    } else {
      console.log("Requirement Version:", version);
      console.log("Current time:", new Date().toISOString());
    }
  }
}

run();
