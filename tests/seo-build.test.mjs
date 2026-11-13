import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { loadEnv } from "vite";

const outputDirectory = path.resolve("dist");
const readOutput = (relativePath) => readFile(path.join(outputDirectory, relativePath), "utf8");
const buildEnv = loadEnv("production", process.cwd(), "VITE_");
const expectedSiteUrl = new URL(
  buildEnv.VITE_SITE_URL?.trim() || "https://smart-chief-prasadavishwesh.vercel.app",
).origin;
const socialImage = `${expectedSiteUrl}/og-image.png`;
const loadTypeScriptModule = async (relativePath) => {
  const source = await readFile(path.resolve(relativePath), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
};
const [
  { recipes },
  { getRecipeImage, getRecipeImageAlt, getRecipeImageCredit, unverifiedRecipeImagePlaceholder },
  { getWebpImageUrl },
  { readLocalMealPlans, upsertLocalMealPlan, writeLocalMealPlans },
] = await Promise.all([
  loadTypeScriptModule("src/data/recipes.ts"),
  loadTypeScriptModule("src/utils/recipeImages.ts"),
  loadTypeScriptModule("src/utils/imageFormat.ts"),
  loadTypeScriptModule("src/lib/localMealPlans.ts"),
]);
const shoppingListSource = await readFile(path.resolve("src/lib/shoppingList.ts"), "utf8");
const shoppingListModule = ts.transpileModule(shoppingListSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { getShoppingListItems } = await import(
  `data:text/javascript;base64,${Buffer.from(shoppingListModule).toString("base64")}`
);

const sitemap = await readOutput("sitemap.xml");
const sitemapEntries = [...sitemap.matchAll(/<url><loc>(.*?)<\/loc><lastmod>(.*?)<\/lastmod><\/url>/g)];
const sitemapUrls = sitemapEntries.map((match) => match[1]);
const parseStructuredData = (html) => {
  const jsonLd = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
  assert.ok(jsonLd, "page includes JSON-LD");
  return JSON.parse(jsonLd[1]);
};
const schemaTypes = (schema) => schema["@graph"]
  ? schema["@graph"].map((item) => item["@type"])
  : [schema["@type"]];
const metaValue = (html, name) => html.match(new RegExp(`<meta ${name} content="([^"]*)"\\s*\\/?>`))?.[1];
const decodeHtml = (value) => value
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");

test("prerenders the homepage with content, social image, and home schemas", async () => {
  const html = await readOutput("index.html");
  assert.match(html, /<h1[^>]*>Plan meals\. Shop smarter\.<\/h1>/);
  assert.match(html, /<h2>Featured recipes<\/h2>/);
  assert.match(html, /<h2>How Smart Chief works<\/h2>/);
  assert.match(html, /<h2>Frequently asked questions<\/h2>/);
  assert.match(html, /<link rel="preload" as="image"[^>]*fetchpriority="high"/);
  assert.match(html, /<img[^>]*alt="Fresh ingredients[^"]*"[^>]*width="1920"[^>]*height="1080"/);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  const schema = parseStructuredData(html);
  assert.equal(canonical?.[1], `${expectedSiteUrl}/`);
  assert.equal(schema["@graph"].find((item) => item["@type"] === "WebSite").url, canonical?.[1]);
  assert.equal(schema["@graph"].find((item) => item["@type"] === "Organization").url, canonical?.[1]);
  assert.deepEqual(new Set(schemaTypes(schema)), new Set(["WebSite", "Organization", "FAQPage"]));
  assert.equal(metaValue(html, 'property="og:image"'), socialImage);
  assert.equal(metaValue(html, 'name="twitter:image"'), socialImage);
  assert.doesNotMatch(html, /@Lovable|images\.pexels\.com/);
});

test("prerenders public informational routes and the public meal planner", async () => {
  const routes = [
    ["recipes/index.html", "/recipes/", /<h1>Explore recipes<\/h1>/],
    ["meal-planner/index.html", "/meal-planner/", /<h1>Weekly meal planner<\/h1>/],
    ["about/index.html", "/about/", /<h1>About Smart Chief<\/h1>/],
    ["faq/index.html", "/faq/", /<h1>Frequently asked questions<\/h1>/],
    ["assistant/index.html", "/assistant/", /<h1>Cooking Assistant<\/h1>/],
  ];

  for (const [file, route, bodyPattern] of routes) {
    const html = await readOutput(file);
    assert.match(html, bodyPattern);
    assert.equal(html.match(/<h1\b/g)?.length, 1, `${route} has one H1`);
    assert.equal(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1], `${expectedSiteUrl}${route}`);
    assert.equal(metaValue(html, 'name="robots"'), "index, follow", `${route} is indexable`);
    assert.ok(schemaTypes(parseStructuredData(html)).includes("BreadcrumbList"), `${route} has breadcrumbs`);
    assert.ok(html.match(/<title>(.*?)<\/title>/)?.[1].length < 60, `${route} title is under 60 characters`);
    assert.ok(metaValue(html, 'name="description"').length < 160, `${route} description is under 160 characters`);
    assert.equal(metaValue(html, 'property="og:image"'), socialImage);
  }
  assert.ok(schemaTypes(parseStructuredData(await readOutput("faq/index.html"))).includes("FAQPage"));
  assert.doesNotMatch(await readOutput("robots.txt"), /Disallow:\s*\/assistant(?:\s|$)/);
});

test("prerenders recipe routes with bounded metadata, recipe data, and breadcrumbs", async () => {
  const recipeUrls = sitemapUrls.filter((url) => new URL(url).pathname.startsWith("/recipes/") && !new URL(url).pathname.endsWith("/recipes/"));
  assert.ok(recipeUrls.length > 300, "sitemap includes recipe detail pages");
  assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "sitemap URLs are unique");
  const recipeListing = await readOutput("recipes/index.html");
  assert.equal(
    recipeListing.match(/<li><a href="\/recipes\//g)?.length,
    recipeUrls.length,
    "source-visible recipes page lists every recipe",
  );

  for (const url of recipeUrls) {
    const route = new URL(url).pathname;
    const html = await readOutput(path.join(route.slice(1), "index.html"));
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    const schema = parseStructuredData(html);
    const recipeSchema = schema["@graph"].find((item) => item["@type"] === "Recipe");
    const title = html.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
    const description = decodeHtml(metaValue(html, 'name="description"') ?? "");

    assert.equal(canonical?.[1], url, `${route} has a matching canonical URL`);
    assert.ok(recipeSchema, `${route} includes Recipe JSON-LD`);
    assert.ok(schema["@graph"].some((item) => item["@type"] === "BreadcrumbList"));
    assert.equal(recipeSchema.url, url);
    assert.ok(recipeSchema.recipeIngredient.length > 0);
    assert.ok(recipeSchema.recipeInstructions.length > 0);
    assert.ok(recipeSchema.nutrition);
    const recipe = recipes.find(({ name }) => name === recipeSchema.name);
    assert.ok(recipe, `${route} matches a recipe dataset item`);
    const expectedImage = getRecipeImage(recipe);
    if (expectedImage === unverifiedRecipeImagePlaceholder) {
      assert.equal(recipeSchema.image, undefined, `${route} does not advertise a placeholder as a recipe photo`);
    } else {
      assert.equal(recipeSchema.image[0], expectedImage, `${route} schema uses its resolved recipe image`);
    }
    assert.equal(
      decodeHtml(html.match(/<img[^>]*src="([^"]+)"/)?.[1] ?? ""),
      expectedImage,
      `${route} static HTML uses the same resolved recipe image`,
    );
    const webpSource = html.match(/<source[^>]*srcset="([^"]+)"/)?.[1];
    if (expectedImage === unverifiedRecipeImagePlaceholder) {
      assert.equal(webpSource, undefined, `${route} does not request WebP for its local SVG placeholder`);
      assert.match(html, /<img[^>]*alt="Photo pending verification for Mawa Bati"/);
      assert.doesNotMatch(html, /39596666/);
      assert.equal(
        decodeHtml(html.match(/<img[^>]*src="([^"]+)"/)?.[1] ?? ""),
        unverifiedRecipeImagePlaceholder,
        `${route} static HTML uses the neutral placeholder`,
      );
    } else {
      assert.equal(
        decodeHtml(webpSource ?? ""),
        getWebpImageUrl(expectedImage),
        `${route} has a WebP source for its displayed recipe image`,
      );
    }
    const imageCredit = getRecipeImageCredit(recipe.name, recipe.imageCredit);
    if (imageCredit) {
      assert.ok(html.includes(imageCredit.sourceUrl), `${route} credits the image source`);
      assert.ok(html.includes(imageCredit.licenseUrl), `${route} links the image license`);
    }
    assert.ok(title.length < 60, `${route} title is under 60 characters`);
    assert.ok(description.length < 160, `${route} description is under 160 characters`);
    assert.equal(metaValue(html, 'property="og:image"'), socialImage);
    if (expectedImage !== unverifiedRecipeImagePlaceholder) {
      assert.match(html, /<source type="image\/webp" srcset=/);
    }
    assert.match(html, /<img[^>]*alt="[^"]+"[^>]*width="800"[^>]*height="600"/);
    assert.match(html, /<h1>/);
    assert.match(html, /<ol>/);
  }
});

test("corrected dish images use attributed and optimized source assets", () => {
  const correctedDishes = [
    "Chole Bhature",
    "Chole Bhature Delhi Style",
    "Vada Pav",
    "Misal Pav",
    "Aloo Tikki",
    "Medu Vada",
    "Rava Idli",
    "Sandesh",
    "Cham Cham",
    "Peda",
    "Doodh Peda",
    "Ghevar",
    "Kalakand",
    "Pinni",
    "Thekua",
    "Pitha",
    "Sel Roti",
    "Churma",
    "Miso Soup",
    "Tempura",
    "Jollof Rice",
  ];

  for (const dish of correctedDishes) {
    const recipe = recipes.find(({ name }) => name === dish);
    assert.ok(recipe, `${dish} exists in the recipe dataset`);
    const image = getRecipeImage(recipe);
    const credit = getRecipeImageCredit(dish, recipe.imageCredit);
    assert.match(image, /wikimedia\.org/, `${dish} uses its matching Commons asset`);
    assert.ok(credit, `${dish} has an image attribution`);
    assert.match(credit.sourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.ok(credit.artist);
    assert.ok(credit.license);
    assert.equal(getWebpImageUrl(image).endsWith(".webp"), true, `${dish} offers a WebP image`);
  }

  const peda = recipes.find(({ name }) => name === "Peda");
  const doodhPeda = recipes.find(({ name }) => name === "Doodh Peda");
  const milkPedaImage = getRecipeImage(doodhPeda);
  assert.notEqual(milkPedaImage, getRecipeImage(peda), "Doodh Peda uses its separately verified milk-peda photo");
  assert.ok(milkPedaImage.includes("/9/91/Indian_Sweet_Dessert_Peda_in_a_white_bone_china_plate.jpg/960px-Indian_Sweet_Dessert_Peda_in_a_white_bone_china_plate.jpg"));
  assert.equal(getWebpImageUrl(milkPedaImage), `${milkPedaImage}.webp`);
  assert.equal(getRecipeImageCredit("Doodh Peda").artist, "Prashant Sahu");
  assert.equal(getRecipeImageCredit("Doodh Peda").sourceUrl, "https://commons.wikimedia.org/wiki/File:Indian_Sweet_Dessert_Peda_in_a_white_bone_china_plate.jpg");
  assert.equal(getRecipeImageCredit("Doodh Peda").license, "CC BY-SA 4.0");
  assert.equal(getRecipeImageCredit("Doodh Peda").licenseUrl, "https://creativecommons.org/licenses/by-sa/4.0");

  const mawaBati = recipes.find(({ name }) => name === "Mawa Bati");
  const mawaBatiImage = getRecipeImage(mawaBati);
  assert.equal(mawaBatiImage, unverifiedRecipeImagePlaceholder);
  assert.equal(getRecipeImageAlt(mawaBati, mawaBatiImage), "Photo pending verification for Mawa Bati");
  assert.equal(getRecipeImageCredit("Mawa Bati", mawaBati.imageCredit), undefined);
});

test("the neutral unverified-image placeholder is included in production output", async () => {
  const placeholder = await readOutput("images/recipe-image-unverified.svg");
  assert.match(placeholder, /Photo pending verification/);
});

test("sitemap, robots, private pages, and 404 output are correct", async () => {
  const requiredRoutes = ["/", "/recipes/", "/meal-planner/", "/about/", "/faq/"];
  for (const route of requiredRoutes) {
    assert.ok(sitemapUrls.some((url) => new URL(url).pathname === route), `${route} is listed in sitemap`);
  }
  assert.ok(sitemapEntries.length > 365);
  assert.ok(sitemapEntries.every(([, , lastmod]) => /^\d{4}-\d{2}-\d{2}$/.test(lastmod)));
  assert.ok(sitemapUrls.every((url) => new URL(url).origin === expectedSiteUrl));

  const robots = await readOutput("robots.txt");
  assert.match(robots, /User-agent: \*\s+Allow: \//);
  assert.match(robots, /Disallow: \/account/);
  assert.match(robots, /Disallow: \/dashboard/);
  assert.match(robots, /Disallow: \/favorites/);
  assert.doesNotMatch(robots, /Disallow:\s*\/assistant(?:\s|$)/);
  assert.match(robots, new RegExp(`Sitemap: ${expectedSiteUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/sitemap\\.xml`));

  const favorites = await readOutput("favorites/index.html");
  assert.equal(metaValue(favorites, 'name="robots"'), "noindex, nofollow");
  const notFound = await readOutput("404.html");
  assert.match(notFound, /<h1>Page not found<\/h1>/);
  assert.equal(metaValue(notFound, 'name="robots"'), "noindex, nofollow");
});

test("custom social image is a 1200 by 630 PNG", async () => {
  const image = await readFile(path.resolve("dist/og-image.png"));
  assert.equal(image.toString("hex", 1, 4), "504e47");
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});

test("shopping list merges duplicate ingredients and ignores blank entries", () => {
  const items = getShoppingListItems([
    { recipe_data: { ingredients: [" 2 cups carrots ", "Olive oil", ""] } },
    { recipe_data: { ingredients: ["olive oil", "CARROTS", "   "] } },
  ]);
  assert.equal(items.length, 3);
  assert.ok(items.includes("2 cups carrots"));
  assert.ok(items.includes("Olive oil"));
  assert.ok(items.includes("CARROTS"));
  assert.deepEqual(items, [...items].sort((first, second) => first.localeCompare(second)));
});

test("local meal plans persist and replace a recipe in the same slot", () => {
  let value = null;
  const storage = {
    getItem: () => value,
    setItem: (_key, nextValue) => { value = nextValue; },
  };
  const breakfast = {
    id: "local-1",
    user_id: "local",
    date: "2025-11-10",
    meal_type: "Breakfast",
    recipe_id: "1",
    recipe_data: { name: "Oats", ingredients: ["Oats"] },
  };
  const replacement = {
    ...breakfast,
    id: "local-2",
    recipe_id: "2",
    recipe_data: { name: "Eggs", ingredients: ["Eggs"] },
  };
  const lunch = {
    ...breakfast,
    id: "local-3",
    meal_type: "Lunch",
    recipe_id: "3",
  };

  writeLocalMealPlans([breakfast], storage);
  const updated = upsertLocalMealPlan(readLocalMealPlans(storage), replacement);
  writeLocalMealPlans(upsertLocalMealPlan(updated, lunch), storage);
  assert.deepEqual(readLocalMealPlans(storage), [replacement, lunch]);

  storage.setItem("", JSON.stringify([{}]));
  assert.throws(() => readLocalMealPlans(storage), /invalid format/);
});
