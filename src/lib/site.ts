export const DEFAULT_SITE_URL = "https://smart-chief-prasadavishwesh.vercel.app";

export const getSiteUrl = (configuredUrl?: string): string => {
  const parsedUrl = new URL(configuredUrl?.trim() || DEFAULT_SITE_URL);
  if (!["http:", "https:"].includes(parsedUrl.protocol) || parsedUrl.pathname !== "/" || parsedUrl.search || parsedUrl.hash) {
    throw new Error("VITE_SITE_URL must be an origin such as https://www.example.com.");
  }
  return parsedUrl.origin;
};
