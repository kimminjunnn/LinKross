-- ENUMs
DO $$ BEGIN
    CREATE TYPE public.sow_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.criterion_kind AS ENUM ('acceptance_criteria', 'definition_of_done');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.verification_method AS ENUM ('manual', 'automated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- user_role is defined in schema.sql, we assume it exists. If not, it can be created here.
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('company', 'freelancer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SOW_VERSIONS
CREATE TABLE IF NOT EXISTS public.sow_versions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL,
    source_requirement_version_id uuid,
    source_proposal_id uuid,
    version_number int NOT NULL DEFAULT 1,
    status public.sow_status NOT NULL DEFAULT 'draft',
    content jsonb,
    content_hash text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- SOW_APPROVALS
CREATE TABLE IF NOT EXISTS public.sow_approvals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sow_version_id uuid NOT NULL REFERENCES public.sow_versions(id) ON DELETE CASCADE,
    approver_id uuid NOT NULL, -- Would ideally reference auth.users(id) or public.profiles(id)
    approver_role public.user_role NOT NULL,
    content_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- MILESTONES
CREATE TABLE IF NOT EXISTS public.milestones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL,
    sow_version_id uuid NOT NULL REFERENCES public.sow_versions(id) ON DELETE CASCADE,
    code text NOT NULL,
    title text NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    status public.milestone_status NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- COMPLETION_CRITERIA
CREATE TABLE IF NOT EXISTS public.completion_criteria (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sow_version_id uuid NOT NULL REFERENCES public.sow_versions(id) ON DELETE CASCADE,
    milestone_id uuid NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    kind public.criterion_kind NOT NULL,
    verification_method public.verification_method NOT NULL DEFAULT 'manual',
    description text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.sow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completion_criteria ENABLE ROW LEVEL SECURITY;

-- Disable RLS strictly for now to allow MVP development, or create open policies.
-- In a real app, you should restrict this.
CREATE POLICY "Allow all on sow_versions" ON public.sow_versions FOR ALL USING (true);
CREATE POLICY "Allow all on sow_approvals" ON public.sow_approvals FOR ALL USING (true);
CREATE POLICY "Allow all on milestones" ON public.milestones FOR ALL USING (true);
CREATE POLICY "Allow all on completion_criteria" ON public.completion_criteria FOR ALL USING (true);
