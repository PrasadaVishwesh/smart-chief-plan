import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadEnv } from "vite";
import ts from "typescript";

const root = process.cwd();
const outputDirectory = path.join(root, "dist");
const env = loadEnv("production", root, "VITE_");
const configuredSiteUrl = env.VITE_SITE_URL?.trim();
if (!configuredSiteUrl) throw new Error("Set VITE_SITE_URL to the production origin before building canonical URLs and the sitemap.");
const parsedSiteUrl = new URL(configuredSiteUrl);
if (!["http:", "https:"].includes(parsedSiteUrl.protocol) || parsedSiteUrl.pathname !== "/" || parsedSiteUrl.search || parsedSiteUrl.hash) {
  throw new Error("VITE_SITE_URL must be an origin such as https://www.example.com.");
}
const siteUrl = parsedSiteUrl.origin;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

const loadTypeScriptModule = async (relativePath) => {
  const source = await readFile(path.join(root, relativePath), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
};
const [{ recipes }, seo, imageFormat] = await Promise.all([
  loadTypeScriptModule("src/data/recipes.ts"),
  loadTypeScriptModule("src/lib/seo.ts"),
  loadTypeScriptModule("src/utils/imageFormat.ts"),
]);
const { getRecipeSlug, getRecipeSeo, getRecipeStructuredData } = seo;
const { getWebpImageUrl } = imageFormat;
  const assetFiles = await readdir(path.join(outputDirectory, "assets"));
  const heroAsset = assetFiles.find((file) => /^hero-image-.*\.(?:jpg|webp)$/.test(file));
  const heroImageUrl = heroAsset ? `/assets/${heroAsset}` : "";
  const baseHtml = (await readFile(path.join(outputDirectory, "index.html"), "utf8"))
    .replace("</head>", `${heroAsset ? `<link rel="preload" as="image" href="${heroImageUrl}" fetchpriority="high">` : ""}</head>`);
  const pageEntries = [{
    path: "/",
    title: "Smart Chief | Discover Recipes & Plan Weekly Meals",
    description: `Explore ${recipes.length} recipes, build a weekly meal plan, and organize your shopping list with Smart Chief.`,
    image: recipes[0]?.image,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Smart Chief",
      url: new URL("/", `${siteUrl}/`).href,
      description: "Discover recipes, plan weekly meals, and organize your shopping list.",
    },
    content: `<main><div class="relative h-[40vh] overflow-hidden">${heroImageUrl ? `<img src="${heroImageUrl}" alt="Fresh ingredients ready for a home-cooked meal" class="w-full h-full object-cover" width="1920" height="1080" fetchpriority="high" decoding="async">` : ""}<div class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex items-end"><div class="container mx-auto px-4 pb-8"><h1 class="text-4xl md:text-5xl font-bold mb-2">Smart Chief</h1><p class="text-lg text-muted-foreground">Browse ${recipes.length} recipes, plan your week, and build a shopping list</p></div></div></div><section class="container mx-auto px-4 pt-8 max-w-4xl"><h2 class="text-2xl font-semibold mb-2">Recipes for everyday cooking</h2><p class="text-muted-foreground">Search by dish, explore cuisines, or filter by dietary preferences. Open any recipe for ingredients and step-by-step instructions, then use it to plan your week.</p><nav aria-label="Meal planning"><a href="/meal-planner">Open the weekly meal planner</a></nav></section><section><h2>Explore recipes</h2><ul>${recipes.map((recipe) => `<li><a href="/recipes/${escapeHtml(getRecipeSlug(recipe, recipes))}/">${escapeHtml(recipe.name)}</a> — ${escapeHtml(recipe.cuisine)}</li>`).join("")}</ul></section></main>`,
  }];

  for (const recipe of recipes) {
    const slug = getRecipeSlug(recipe, recipes);
    const route = `/recipes/${slug}/`;
    const seo = getRecipeSeo(recipe);
    const recipeUrl = new URL(route, `${siteUrl}/`).href;
    const structuredData = getRecipeStructuredData(recipe, recipeUrl);
    pageEntries.push({
      path: route,
      title: seo.title,
      description: seo.description,
      image: recipe.image,
      structuredData,
      content: `<main><nav aria-label="Breadcrumb"><a href="/">Recipes</a> / <span>${escapeHtml(recipe.name)}</span></nav><article><h1>${escapeHtml(recipe.name)}</h1><p>${escapeHtml(recipe.description)}</p><p>${escapeHtml(recipe.cuisine)} · ${recipe.prepTime + recipe.cookTime} minutes · ${recipe.servings} servings</p><picture>${getWebpImageUrl(recipe.image) !== recipe.image ? `<source type="image/webp" srcset="${escapeHtml(getWebpImageUrl(recipe.image))}">` : ""}<img src="${escapeHtml(recipe.image)}" alt="${escapeHtml(recipe.name)}, a ${escapeHtml(recipe.cuisine)} recipe" width="800" height="600" fetchpriority="high" decoding="async"></picture><h2>Ingredients</h2><ul>${recipe.ingredients.map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join("")}</ul><h2>Instructions</h2><ol>${recipe.instructions.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol><p><a href="/meal-planner">Open the weekly meal planner</a></p></article></main>`,
    });
  }

  for (const page of pageEntries) {
    const canonicalUrl = new URL(page.path, `${siteUrl}/`).href;
    const html = baseHtml
      .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(page.description)}" />`)
      .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(page.title)}" />`)
      .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`)
      .replace(/<meta property="og:image" content="[^"]*"\s*\/>/, page.image ? `<meta property="og:image" content="${escapeHtml(page.image)}" />` : "")
      .replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, page.image ? `<meta name="twitter:image" content="${escapeHtml(page.image)}" />` : "")
      .replace(/<meta property="og:type" content="[^"]*"\s*\/>/, `<meta property="og:type" content="${page.structuredData?.["@type"] === "Recipe" ? "article" : "website"}" />`)
      .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`)
      .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`)
      .replace("</head>", `<link rel="canonical" href="${escapeHtml(canonicalUrl)}"><meta property="og:url" content="${escapeHtml(canonicalUrl)}">${page.structuredData ? `<script type="application/ld+json">${JSON.stringify(page.structuredData).replace(/</g, "\\u003c")}</script>` : ""}</head>`)
      .replace('<div id="root"></div>', `<div id="root">${page.content}</div>`);

    const outputPath = page.path === "/"
      ? path.join(outputDirectory, "index.html")
      : path.join(outputDirectory, page.path.slice(1), "index.html");
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);
  }

  const sitemapEntries = pageEntries.map((page) => {
    const url = new URL(page.path, `${siteUrl}/`).href;
    return `  <url><loc>${escapeHtml(url)}</loc></url>`;
  }).join("\n");
  await writeFile(path.join(outputDirectory, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`);
  const robots = await readFile(path.join(outputDirectory, "robots.txt"), "utf8");
  await writeFile(path.join(outputDirectory, "robots.txt"), `${robots.replace(/^Sitemap:.*\n?/gim, "").trimEnd()}\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`Prerendered homepage and ${recipes.length} recipe pages.`);
