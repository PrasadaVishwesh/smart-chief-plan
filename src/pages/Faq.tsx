import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { faqItems } from "@/data/siteContent";
import { getBreadcrumbStructuredData, getFaqStructuredData, getStructuredDataGraph } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl(import.meta.env.VITE_SITE_URL);

const Faq = () => (
  <>
    <Seo
      title="Frequently Asked Questions | Smart Chief"
      description="Answers about finding recipes, planning weekly meals, and creating a shopping list with Smart Chief."
      canonicalPath="/faq/"
      structuredData={getStructuredDataGraph(
        getFaqStructuredData(faqItems),
        getBreadcrumbStructuredData([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq/" }], siteUrl),
      )}
    />
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm"><Link to="/">Home</Link> / <span aria-current="page">FAQ</span></nav>
      <h1 className="text-4xl font-bold">Frequently asked questions</h1>
      <div className="mt-8 space-y-7">
        {faqItems.map(({ question, answer }) => (
          <article key={question}>
            <h2 className="text-xl font-semibold">{question}</h2>
            <p className="mt-2 text-muted-foreground">{answer}</p>
          </article>
        ))}
      </div>
      <p className="mt-10"><Link className="text-primary underline" to="/recipes">Browse recipes</Link> or <Link className="text-primary underline" to="/meal-planner">start a meal plan</Link>.</p>
    </main>
  </>
);

export default Faq;
