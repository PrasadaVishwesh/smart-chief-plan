import { useEffect } from "react";
import type { PageSeo } from "@/lib/seo";

interface SeoProps extends PageSeo {
  canonicalPath?: string;
  image?: string;
  structuredData?: Record<string, unknown>;
  noIndex?: boolean;
}

const updateMeta = (selector: string, value: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    const [key, content] = selector.match(/\[([^=]+)="([^"]+)"\]/)?.slice(1) ?? [];
    if (key && content) element.setAttribute(key, content);
    document.head.appendChild(element);
  }
  element.content = value;
};

const Seo = ({ title, description, canonicalPath, image, structuredData, noIndex = false }: SeoProps) => {
  useEffect(() => {
    document.title = title;
    updateMeta('meta[name="description"]', description);
    updateMeta('meta[name="robots"]', noIndex ? "noindex, nofollow" : "index, follow");
    updateMeta('meta[property="og:title"]', title);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[property="og:type"]', structuredData?.["@type"] === "Recipe" ? "article" : "website");
    updateMeta('meta[name="twitter:title"]', title);
    updateMeta('meta[name="twitter:description"]', description);

    if (image) {
      updateMeta('meta[property="og:image"]', image);
      updateMeta('meta[name="twitter:image"]', image);
    }

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalPath) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = new URL(canonicalPath, window.location.origin).href;
      updateMeta('meta[property="og:url"]', canonical.href);
    }

    let schema = document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (structuredData) {
      if (!schema) {
        schema = document.createElement("script");
        schema.type = "application/ld+json";
        document.head.appendChild(schema);
      }
      schema.textContent = JSON.stringify(structuredData);
    } else {
      schema?.remove();
    }
  }, [title, description, canonicalPath, image, structuredData, noIndex]);

  return null;
};

export default Seo;
