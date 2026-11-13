export type SmartChiefEvent =
  | "recipe_search"
  | "recipe_view"
  | "meal_plan_created";

export const trackEvent = (
  event: SmartChiefEvent,
  properties: Record<string, string | number | boolean> = {},
) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("smartchief:analytics", {
    detail: { event, ...properties },
  }));
};
