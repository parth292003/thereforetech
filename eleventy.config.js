// Therefore Tech — Eleventy configuration.
// Architecture and module boundaries: docs/PLAN.md §2.
import fs from "node:fs";
import path from "node:path";

const IS_PRODUCTION = process.env.ELEVENTY_ENV === "production";
const REQUIRED_SEO_FIELDS = ["title", "description", "targetPhrase", "h1"];

/** Read CSS files from src/assets/css and return them minified for inlining in <head>. */
function readCss(files) {
  return files
    .map((f) => fs.readFileSync(path.join("src/assets/css", f), "utf8"))
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s*\n\s*/g, "")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

export default function (eleventyConfig) {
  // ---- Drafts and dev-only pages never reach a production build (PLAN §6). ----
  // INCLUDE_DEV_PAGES=1 (npm run build:preview) keeps them, for review and Lighthouse runs only.
  eleventyConfig.addPreprocessor("drafts", "*", (data) => {
    if (IS_PRODUCTION && data.draft && !process.env.INCLUDE_DEV_PAGES) return false;
    if (IS_PRODUCTION && data.devOnly && !process.env.INCLUDE_DEV_PAGES) return false;
  });

  // ---- Static assets ----
  eleventyConfig.addPassthroughCopy({ "src/assets/fonts": "assets/fonts" });
  eleventyConfig.addPassthroughCopy({ "src/assets/js": "assets/js" });
  eleventyConfig.addPassthroughCopy({ "src/media": "media" });
  eleventyConfig.addPassthroughCopy({ "src/static": "/" }); // CNAME, favicon etc.

  // ---- Template helpers ----
  eleventyConfig.addShortcode("inlineCss", (...files) => readCss(files));
  eleventyConfig.addFilter("absoluteUrl", (url, base) => new URL(url, base).href);
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));
  eleventyConfig.addFilter("split", (value, sep) => String(value).split(sep));
  // Inner pages: turn flat content into editorial grid rows. Text before the first <h2> becomes the lead;
  // each <h2> and what follows becomes a row with the title on the left and the body on the right.
  eleventyConfig.addFilter("sectionize", (html) => {
    // Only top-level headings (at the start of a line) split; an <h2> nested in a list stays put.
    const parts = String(html).split(/(?=^<h2[\s>])/m);
    const lead = parts[0].trim() && !/^<h2[\s>]/.test(parts[0]) ? parts.shift() : null;
    let out = lead ? `<div class="container grid page__lead"><div class="page__lead-text" data-reveal>${lead}</div></div>` : "";
    for (const part of parts) {
      const m = part.match(/^<h2([^>]*)>([\s\S]*?)<\/h2>([\s\S]*)$/);
      if (!m) { if (part.trim()) out += part; continue; }
      out += `<section class="container grid block"><hr class="rule" data-reveal="rule"><h2${m[1]} class="block__title">${m[2]}</h2><div class="block__body" data-reveal>${m[3]}</div></section>`;
    }
    return out;
  });
  eleventyConfig.addGlobalData("buildEnv", IS_PRODUCTION ? "production" : "development");
  eleventyConfig.addGlobalData("buildYear", new Date().getFullYear());
  // DRAFT banners show in dev and preview builds, never in a plain production build.
  eleventyConfig.addGlobalData("showDraftMarks", !IS_PRODUCTION || !!process.env.INCLUDE_DEV_PAGES);

  // ---- SEO guard: every indexable page has its SEO fields, and titles/descriptions are unique ----
  eleventyConfig.addCollection("seoPages", (api) => {
    const pages = api.getAll().filter((p) => p.outputPath && p.outputPath.endsWith(".html") && !p.data.noindex);
    const problems = [];
    const seen = { title: new Map(), description: new Map(), targetPhrase: new Map() };
    for (const p of pages) {
      for (const field of REQUIRED_SEO_FIELDS) {
        if (!p.data[field]) problems.push(`${p.inputPath}: missing "${field}"`);
      }
      if (!p.data.seo?.pages?.[p.url]) problems.push(`${p.inputPath}: URL ${p.url} is not in the keyword map (src/_data/seo.json)`);
      for (const field of ["title", "description", "targetPhrase"]) {
        const v = p.data[field];
        if (!v) continue;
        if (seen[field].has(v)) problems.push(`${p.inputPath}: duplicate ${field} (also in ${seen[field].get(v)})`);
        else seen[field].set(v, p.inputPath);
      }
      if (p.data.title && p.data.title.length > 60) problems.push(`${p.inputPath}: title over 60 chars`);
      if (p.data.description && p.data.description.length > 155) problems.push(`${p.inputPath}: description over 155 chars`);
    }
    if (problems.length) throw new Error("SEO check failed:\n  " + problems.join("\n  "));
    return pages;
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
