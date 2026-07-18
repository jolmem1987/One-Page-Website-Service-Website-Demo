/** Standard result shape returned by admin server actions for form feedback. */
export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const idle: ActionResult = { ok: false };
