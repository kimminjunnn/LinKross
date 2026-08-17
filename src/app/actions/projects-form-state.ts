export type CreateProjectFormState = {
  status: "idle" | "error" | "success";
  error: string | null;
  warning: string | null;
  fieldErrors: Record<string, string>;
  projectId: string | null;
};

export const initialCreateProjectFormState: CreateProjectFormState = {
  status: "idle",
  error: null,
  warning: null,
  fieldErrors: {},
  projectId: null,
};
