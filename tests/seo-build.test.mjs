import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const outputDirectory = path.resolve("dist");
const readOutput = (relativePath) => readFile(path.join(outputDirectory, relativePath), "utf8");
const shoppingListSource = await readFile(path.resolve("src/lib/shoppingList.ts"), "utf8");
const shoppingListModule = ts.transpileModule(shoppingListSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { getShoppingListItems } = await import(
  `data:text/javascript;base64,${Buffer.from(shoppingListModule).toString("base64")}`
);

const sitemapUrls = async () => {
  const sitemap = await readOutput("sitemap.xml");
  return [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
};

test("prerenders the homepage with a high-priority hero image", async () => {
  const html = await readOutput("index.html");
  assert.match(html, /<h1[^>]*>Smart Chief<\/h1>/);
  assert.match(html, /<link rel="preload" as="image"[^>]*fetchpriority="high"/);
  assert.match(html, /<img[^>]*alt="Fresh ingredients[^"]*"[^>]*width="1920"[^>]*height="1080"/);
  assert.match(html, /weekly meal plan/i);
  const jsonLd = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
  assert.equal(JSON.parse(jsonLd[1])["@type"], "WebSite");
});

test("sitemap recipe routes have canonical pages and Recipe JSON-LD", async () => {
  const urls = await sitemapUrls();
  assert.ok(urls.length > 1, "sitemap includes recipe pages");
  assert.equal(new Set(urls).size, urls.length, "sitemap URLs are unique");

  for (const url of urls.slice(1)) {
    const route = new URL(url).pathname;
    const html = await readOutput(path.join(route.slice(1), "index.html"));
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    const jsonLd = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);

    assert.equal(canonical?.[1], url, `${route} has a matching canonical URL`);
    assert.ok(jsonLd, `${route} includes structured data`);
    assert.match(html, /<source type="image\/webp" srcset=/);
    assert.match(html, /<img[^>]*alt="[^"]+"[^>]*width="800"[^>]*height="600"/);
    const recipe = JSON.parse(jsonLd[1]);
    assert.equal(recipe["@type"], "Recipe");
    assert.ok(recipe.recipeIngredient.length > 0);
    assert.match(html, /<h1>/);
    assert.match(html, /<ol>/);
  }
});

test("robots.txt points crawlers to the generated sitemap", async () => {
  const [robots, urls] = await Promise.all([readOutput("robots.txt"), sitemapUrls()]);
  assert.match(robots, new RegExp(`Sitemap: ${urls[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}sitemap\\.xml`));
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

