export type CreateProjectFormState = {
  status: "idle" | "error" | "success";
  error: string | null;
  fieldErrors: Record<string, string>;
  projectId: string | null;
};

export const initialCreateProjectFormState: CreateProjectFormState = {
  status: "idle",
  error: null,
  fieldErrors: {},
  projectId: null,
};
