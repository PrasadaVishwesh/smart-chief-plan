export const getWebpImageUrl = (src: string): string => {
  if (!/^https?:\/\//i.test(src)) return src;

  const url = new URL(src);
  if (url.hostname === "thumb.wikimedia.org") {
    url.pathname = `${url.pathname}.webp`;
    return url.href;
  }
  if (url.hostname !== "images.pexels.com" && url.hostname !== "images.unsplash.com") return src;

  url.searchParams.set("fm", "webp");
  return url.href;
};
