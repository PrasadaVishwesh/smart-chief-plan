import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { loadEnv } from "vite";
import ts from "typescript";

const root = process.cwd();
const outputDirectory = path.join(root, "dist");
const env = loadEnv("production", root, "VITE_");
const buildDate = new Date().toISOString().slice(0, 10);
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

const [{ recipes }, seo, imageFormat, site, recipeImages, { faqItems }] = await Promise.all([
  loadTypeScriptModule("src/data/recipes.ts"),
  loadTypeScriptModule("src/lib/seo.ts"),
  loadTypeScriptModule("src/utils/imageFormat.ts"),
  loadTypeScriptModule("src/lib/site.ts"),
  loadTypeScriptModule("src/utils/recipeImages.ts"),
  loadTypeScriptModule("src/data/siteContent.ts"),
]);
const {
  getBreadcrumbStructuredData,
  getFaqStructuredData,
  getOrganizationStructuredData,
  getRecipeSlug,
  getRecipeSeo,
  getRecipeStructuredData,
  getStructuredDataGraph,
  getWebsiteStructuredData,
} = seo;
const { getWebpImageUrl } = imageFormat;
const { getRecipeImage, getRecipeImageAlt, getRecipeImageCredit } = recipeImages;
const imageCreditMarkup = (credit) => credit
  ? `<p>Image: <a href="${escapeHtml(credit.sourceUrl)}">${escapeHtml(credit.title)}</a> by ${escapeHtml(credit.artist)} via Wikimedia Commons, licensed <a href="${escapeHtml(credit.licenseUrl)}">${escapeHtml(credit.license)}</a>.</p>`
  : "";
const { getSiteUrl } = site;
const siteUrl = getSiteUrl(env.VITE_SITE_URL);
const socialImage = `${siteUrl}/og-image.png`;

const getLastModified = (sourceFile) => {
  try {
    const changed = execFileSync("git", ["status", "--porcelain", "--", sourceFile], { encoding: "utf8" }).trim();
    if (changed) return buildDate;
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", sourceFile], { encoding: "utf8" }).trim() || buildDate;
  } catch {
    return buildDate;
  }
};

const withHead = (html, page) => {
  const canonicalUrl = new URL(page.path, `${siteUrl}/`).href;
  const replacements = [
    [/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`],
    [/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeHtml(page.description)}" />`],
    [/<meta name="robots" content="[^"]*"\s*\/?>/, `<meta name="robots" content="${page.noIndex ? "noindex, nofollow" : "index, follow"}" />`],
    [/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(page.title)}" />`],
    [/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`],
    [/<meta property="og:type" content="[^"]*"\s*\/?>/, `<meta property="og:type" content="${page.ogType ?? "website"}" />`],
    [/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${socialImage}" />`],
    [/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`],
    [/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`],
    [/<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${socialImage}" />`],
  ];
  let head = html;
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(head)) head = head.replace(pattern, replacement);
    else head = head.replace("</head>", `${replacement}</head>`);
  }
  const structuredData = page.structuredData
    ? `<script type="application/ld+json">${JSON.stringify(page.structuredData).replace(/</g, "\\u003c")}</script>`
    : "";
  const canonical = page.canonical === false ? "" : `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`;
  return head.replace("</head>", `${canonical}<meta property="og:url" content="${escapeHtml(canonicalUrl)}">${structuredData}</head>`);
};

const recipePath = (recipe) => `/recipes/${getRecipeSlug(recipe, recipes)}/`;
const breadcrumb = (items) => getBreadcrumbStructuredData(items, siteUrl);
const rootSchema = getStructuredDataGraph(
  getWebsiteStructuredData(`${siteUrl}/`),
  getOrganizationStructuredData(`${siteUrl}/`),
  getFaqStructuredData(faqItems),
);
const baseHtml = await readFile(path.join(outputDirectory, "index.html"), "utf8");
const assetFiles = await readdir(path.join(outputDirectory, "assets"));
const heroAsset = assetFiles.find((file) => /^hero-image-.*\.(?:jpg|webp)$/.test(file));
const heroImageUrl = heroAsset ? `/assets/${heroAsset}` : "";
const htmlTemplate = baseHtml.replace("</head>", `${heroAsset ? `<link rel="preload" as="image" href="${heroImageUrl}" fetchpriority="high">` : ""}</head>`);

const publicPages = [
  {
    path: "/",
    source: "src/pages/Home.tsx",
    title: "Smart Chief | Recipes, Meal Plans & Shopping Lists",
    description: "Discover recipes, plan your week, and automatically organize ingredients into a shopping list with Smart Chief.",
    structuredData: rootSchema,
    content: `<main><section><div class="relative h-[40vh] overflow-hidden">${heroImageUrl ? `<img src="${heroImageUrl}" alt="Fresh ingredients ready for a home-cooked meal" class="h-full w-full object-cover" width="1920" height="1080" fetchpriority="high" decoding="async">` : ""}<div><h1>Plan meals. Shop smarter.</h1><p>Discover recipes, build a weekly meal plan, and automatically combine ingredients into a shopping list.</p><p><a href="/recipes/">Explore recipes</a> · <a href="/meal-planner/">Plan your week</a></p></div></div></section><section><h2>Featured recipes</h2><p>A few ideas to get your next meal started.</p><ul>${recipes.slice(0, 4).map((recipe) => `<li><a href="${recipePath(recipe)}">${escapeHtml(recipe.name)}</a></li>`).join("")}</ul><a href="/recipes/">Browse all recipes</a></section><section><h2>How Smart Chief works</h2><ol><li><h3>Discover</h3><p>Search recipes and narrow choices by cuisine or dietary preferences.</p></li><li><h3>Plan</h3><p>Add meals to your weekly planner and keep the week organized.</p></li><li><h3>Shop</h3><p>Generate a combined ingredient list from the meals you planned.</p></li></ol><a href="/meal-planner/">Open the weekly meal planner</a></section><section><h2>Frequently asked questions</h2>${faqItems.map(({ question, answer }) => `<article><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`).join("")}<a href="/faq/">All FAQs</a></section></main>`,
  },
  {
    path: "/recipes/",
    source: "src/pages/Recipes.tsx",
    title: "Browse Recipes | Smart Chief",
    description: `Search and filter ${recipes.length} recipes by dish, cuisine, and dietary preferences with Smart Chief.`,
    structuredData: getStructuredDataGraph(breadcrumb([{ name: "Home", path: "/" }, { name: "Recipes", path: "/recipes/" } ])),
    content: `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Recipes</span></nav><h1>Explore recipes</h1><p>Search ${recipes.length} recipes by dish, cuisine, and dietary preferences. Open a recipe for ingredients and step-by-step instructions.</p><ul>${recipes.map((recipe) => `<li><a href="${recipePath(recipe)}">${escapeHtml(recipe.name)}</a> — ${escapeHtml(recipe.cuisine)}</li>`).join("")}</ul></main>`,
  },
  {
    path: "/meal-planner/",
    source: "src/pages/MealPlanner.tsx",
    title: "Weekly Meal Planner | Smart Chief",
    description: "Plan meals for the week, keep your schedule organized, and build a shopping list from your selected recipes.",
    structuredData: getStructuredDataGraph(breadcrumb([{ name: "Home", path: "/" }, { name: "Meal Planner", path: "/meal-planner/" } ])),
    content: `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Meal Planner</span></nav><h1>Weekly meal planner</h1><p>Plan breakfasts, lunches, and dinners for the week. Smart Chief can combine ingredients from your planned recipes into a shopping list.</p><p><a href="/recipes/">Find recipes to add to your plan</a></p></main>`,
  },
  {
    path: "/about/",
    source: "src/pages/About.tsx",
    title: "About Smart Chief",
    description: "Learn how Smart Chief helps home cooks discover recipes, plan weekly meals, and organize shopping lists.",
    structuredData: getStructuredDataGraph(breadcrumb([{ name: "Home", path: "/" }, { name: "About", path: "/about/" } ])),
    content: `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>About</span></nav><h1>About Smart Chief</h1><p>Smart Chief brings everyday meal planning together in one place. Explore a recipe collection, organize meals for the week, and create a shopping list from the recipes you choose.</p><h2>Made for practical meal planning</h2><p>Use recipe search and dietary filters to find ideas, then add meals to the planner. The shopping list combines ingredients across planned meals so it is easier to prepare for the week.</p><p><a href="/recipes/">Explore recipes</a> · <a href="/meal-planner/">Open meal planner</a> · <a href="/faq/">Read the FAQs</a></p></main>`,
  },
  {
    path: "/faq/",
    source: "src/pages/Faq.tsx",
    title: "Frequently Asked Questions | Smart Chief",
    description: "Answers about finding recipes, planning weekly meals, and creating a shopping list with Smart Chief.",
    structuredData: getStructuredDataGraph(
      getFaqStructuredData(faqItems),
      breadcrumb([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq/" }]),
    ),
    content: `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>FAQ</span></nav><h1>Frequently asked questions</h1>${faqItems.map(({ question, answer }) => `<article><h2>${escapeHtml(question)}</h2><p>${escapeHtml(answer)}</p></article>`).join("")}<p><a href="/recipes/">Browse recipes</a> · <a href="/meal-planner/">Start a meal plan</a></p></main>`,
  },
  {
    path: "/assistant/",
    source: "src/pages/Assistant.tsx",
    title: "Cooking Assistant | Smart Chief",
    description: "Get help with cooking tips, recipe ideas, and ingredient substitutions.",
    structuredData: getStructuredDataGraph(breadcrumb([{ name: "Home", path: "/" }, { name: "Cooking Assistant", path: "/assistant/" } ])),
    content: `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Cooking Assistant</span></nav><h1>Cooking Assistant</h1><p>Get instant help with recipes, cooking techniques, ingredient substitutions, and nutritional advice.</p><p><a href="/recipes/">Explore recipes</a> · <a href="/meal-planner/">Plan meals for the week</a></p></main>`,
  },
];

const renderPage = async (page, { noIndex = false, canonical = true } = {}) => {
  const html = withHead(htmlTemplate, { ...page, noIndex, canonical })
    .replace('<div id="root"></div>', `<div id="root">${page.content}</div>`);
  const outputPath = page.path === "/"
    ? path.join(outputDirectory, "index.html")
    : path.join(outputDirectory, page.path.slice(1), "index.html");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html);
};

for (const page of publicPages) await renderPage(page);

for (const recipe of recipes) {
  const pathName = recipePath(recipe);
  const recipeWithImage = { ...recipe, image: getRecipeImage(recipe) };
  const canonicalUrl = new URL(pathName, `${siteUrl}/`).href;
  const recipeSchema = getRecipeStructuredData(recipeWithImage, canonicalUrl);
  const recipePage = {
    path: pathName,
    title: getRecipeSeo(recipe).title,
    description: getRecipeSeo(recipe).description,
    ogType: "article",
    structuredData: getStructuredDataGraph(
      recipeSchema,
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Recipes", path: "/recipes/" },
        { name: recipe.name, path: pathName },
      ]),
    ),
    content: `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/recipes/">Recipes</a> / <span>${escapeHtml(recipe.name)}</span></nav><article><h1>${escapeHtml(recipe.name)}</h1><p>${escapeHtml(recipe.description)}</p><p>${escapeHtml(recipe.cuisine)} · ${recipe.prepTime + recipe.cookTime} minutes · ${recipe.servings} servings</p><picture>${getWebpImageUrl(recipeWithImage.image) !== recipeWithImage.image ? `<source type="image/webp" srcset="${escapeHtml(getWebpImageUrl(recipeWithImage.image))}">` : ""}<img src="${escapeHtml(recipeWithImage.image)}" alt="${escapeHtml(getRecipeImageAlt(recipe, recipeWithImage.image))}" width="800" height="600" fetchpriority="high" decoding="async"></picture>${imageCreditMarkup(getRecipeImageCredit(recipe.name, recipe.imageCredit))}<h2>Ingredients</h2><ul>${recipe.ingredients.map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join("")}</ul><h2>Instructions</h2><ol>${recipe.instructions.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol><p><a href="/meal-planner/">Open the weekly meal planner</a></p></article></main>`,
  };
  await renderPage(recipePage);
}

await renderPage({
  path: "/favorites/",
  title: "Saved Recipes | Smart Chief",
  description: "Browse recipes you have saved to your Smart Chief favorites.",
  content: `<main><h1>My favorites</h1><p>Sign in to view your saved recipes.</p><a href="/recipes/">Browse recipes</a></main>`,
}, { noIndex: true });

const notFoundPage = {
  path: "/404.html",
  title: "Page not found | Smart Chief",
  description: "The requested page could not be found.",
  content: `<main><h1>Page not found</h1><p>We couldn't find the page you're looking for.</p><p><a href="/">Return to Smart Chief</a> · <a href="/recipes/">Browse recipes</a></p></main>`,
};
const notFoundHtml = withHead(htmlTemplate, { ...notFoundPage, noIndex: true, canonical: false })
  .replace('<div id="root"></div>', `<div id="root">${notFoundPage.content}</div>`);
await writeFile(path.join(outputDirectory, "404.html"), notFoundHtml);

const allSitemapPages = [
  ...publicPages,
  ...recipes.map((recipe) => ({ path: recipePath(recipe), source: "src/data/recipes.ts" })),
];
const sitemapEntries = allSitemapPages.map((page) => {
  const url = new URL(page.path, `${siteUrl}/`).href;
  return `  <url><loc>${escapeHtml(url)}</loc><lastmod>${getLastModified(page.source)}</lastmod></url>`;
}).join("\n");
await writeFile(path.join(outputDirectory, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`);
await writeFile(path.join(outputDirectory, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /dashboard\nDisallow: /favorites\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
console.log(`Prerendered ${publicPages.length} public routes, ${recipes.length} recipe pages, private noindex routes, and 404.html.`);
