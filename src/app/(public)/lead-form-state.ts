/** Shared state shape for the public estimate form's server action. */
export interface LeadFormState {
  status: "idle" | "success" | "success-nodb" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
}
