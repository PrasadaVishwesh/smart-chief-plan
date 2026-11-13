import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { getBreadcrumbStructuredData, getStructuredDataGraph } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl(import.meta.env.VITE_SITE_URL);

const About = () => (
  <>
    <Seo
      title="About Smart Chief"
      description="Learn how Smart Chief helps home cooks discover recipes, plan weekly meals, and organize shopping lists."
      canonicalPath="/about/"
      structuredData={getStructuredDataGraph(getBreadcrumbStructuredData([
        { name: "Home", path: "/" },
        { name: "About", path: "/about/" },
      ], siteUrl))}
    />
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm"><Link to="/">Home</Link> / <span aria-current="page">About</span></nav>
      <h1 className="text-4xl font-bold">About Smart Chief</h1>
      <p className="mt-5 text-lg text-muted-foreground">
        Smart Chief brings everyday meal planning together in one place. Explore a recipe collection, organize meals for the week, and create a shopping list from the recipes you choose.
      </p>
      <h2 className="mt-8 text-2xl font-semibold">Made for practical meal planning</h2>
      <p className="mt-3 text-muted-foreground">
        Use recipe search and dietary filters to find ideas, then add meals to the planner. The shopping list combines ingredients across planned meals so it is easier to prepare for the week.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link to="/recipes" className="text-primary underline">Explore recipes</Link>
        <Link to="/meal-planner" className="text-primary underline">Open meal planner</Link>
        <Link to="/faq" className="text-primary underline">Read the FAQs</Link>
      </div>
    </main>
  </>
);

export default About;
