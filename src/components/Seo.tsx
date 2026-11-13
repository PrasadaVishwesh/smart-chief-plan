import { Helmet } from "react-helmet-async";
import type { PageSeo } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";

interface SeoProps extends PageSeo {
  canonicalPath?: string;
  structuredData?: Record<string, unknown>;
  noIndex?: boolean;
}

const Seo = ({ title, description, canonicalPath, structuredData, noIndex = false }: SeoProps) => {
  const siteUrl = getSiteUrl(import.meta.env.VITE_SITE_URL);
  const canonicalUrl = canonicalPath ? new URL(canonicalPath, `${siteUrl}/`).href : undefined;
  const socialImage = new URL("/og-image.png", `${siteUrl}/`).href;
  const graph = structuredData?.["@graph"];
  const isRecipe = structuredData?.["@type"] === "Recipe" ||
    (Array.isArray(graph) && graph.some((item) => item && typeof item === "object" && (item as Record<string, unknown>)["@type"] === "Recipe"));

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={isRecipe ? "article" : "website"} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={socialImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImage} />
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
};

export default Seo;
