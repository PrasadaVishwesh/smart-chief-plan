import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import RecipeCard from "@/components/RecipeCard";
import { recipes } from "@/data/recipes";
import { faqItems } from "@/data/siteContent";
import { getFaqStructuredData, getOrganizationStructuredData, getStructuredDataGraph, getWebsiteStructuredData } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import heroImage from "@/assets/hero-image.webp";

const siteUrl = getSiteUrl(import.meta.env.VITE_SITE_URL);
const homeStructuredData = getStructuredDataGraph(
  getWebsiteStructuredData(`${siteUrl}/`),
  getOrganizationStructuredData(siteUrl),
  getFaqStructuredData(faqItems),
);

const Home = () => (
  <>
    <Seo
      title="Smart Chief | Recipes, Meal Plans & Shopping Lists"
      description="Discover recipes, plan your week, and automatically organize ingredients into a shopping list with Smart Chief."
      canonicalPath="/"
      structuredData={homeStructuredData}
    />
    <main>
      <section className="relative min-h-[38vh] overflow-hidden">
        <img
          src={heroImage}
          alt="Fresh ingredients ready for a home-cooked meal"
          className="absolute inset-0 h-full w-full object-cover"
          width={1920}
          height={1080}
          fetchPriority="high"
          decoding="async"
        />
        <div className="relative flex min-h-[38vh] items-end bg-gradient-to-t from-background via-background/65 to-transparent">
          <div className="container mx-auto px-4 py-10">
            <h1 className="mb-3 text-4xl font-bold md:text-5xl">Plan meals. Shop smarter.</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Discover recipes, build a weekly meal plan, and automatically combine ingredients into a shopping list.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/recipes" className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Explore recipes</Link>
              <Link to="/meal-planner" className="rounded-lg border px-5 py-3 font-semibold">Plan your week</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Featured recipes</h2>
            <p className="mt-2 text-muted-foreground">A few ideas to get your next meal started.</p>
          </div>
          <Link className="text-primary underline" to="/recipes">Browse all recipes</Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recipes.slice(0, 4).map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
        </div>
      </section>

      <section className="bg-muted/40 py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-3xl font-bold">How Smart Chief works</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            <li><h3 className="text-xl font-semibold">1. Discover</h3><p className="mt-2 text-muted-foreground">Search recipes and narrow choices by cuisine or dietary preferences.</p></li>
            <li><h3 className="text-xl font-semibold">2. Plan</h3><p className="mt-2 text-muted-foreground">Add meals to your weekly planner and keep the week organized.</p></li>
            <li><h3 className="text-xl font-semibold">3. Shop</h3><p className="mt-2 text-muted-foreground">Generate a combined ingredient list from the meals you planned.</p></li>
          </ol>
          <Link to="/meal-planner" className="mt-6 inline-block text-primary underline">Open the weekly meal planner</Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold">Frequently asked questions</h2>
          <Link className="text-primary underline" to="/faq">All FAQs</Link>
        </div>
        <div className="space-y-5">
          {faqItems.map(({ question, answer }) => (
            <article key={question}>
              <h3 className="text-lg font-semibold">{question}</h3>
              <p className="mt-1 text-muted-foreground">{answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  </>
);

export default Home;
