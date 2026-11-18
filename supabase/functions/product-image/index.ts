// POST { suggestionId } -> { imageUrl: string | null }
//
// Finds a product photo for an Amazon gift idea by reading the first image on
// Amazon's search results page (the same approach as the website). Amazon
// often blocks these requests; the app then shows a placeholder. A photo that
// is found is saved on the suggestion so it is only looked up once.
import { withSupabase } from "npm:@supabase/server@1.9.2";
import { z } from "npm:zod@4.6.7";
import { errorJson, handleUnexpected, json, readJson } from "../_shared/http.ts";

const Input = z.object({ suggestionId: z.uuid() });

const ALLOWED_IMAGE_HOSTS = ["m.media-amazon.com", "images-na.ssl-images-amazon.com"];

function buildSearchQuery(title: string, category: string | null, budgetRange: string): string {
  const budgetUpper = budgetRange.split("-").pop()?.trim() ?? "";
  return [title, category, budgetUpper].filter(Boolean).join(" ");
}

async function findAmazonImage(query: string): Promise<string | null> {
  const response = await fetch(`https://www.amazon.com/s?k=${encodeURIComponent(query)}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;

  const html = await response.text();
  // Each product photo on the results page is an <img class="s-image" src="...">.
  for (const [tag] of html.matchAll(/<img\b[^>]*\bclass="s-image"[^>]*>/g)) {
    const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
    if (!src) continue;
    try {
      const url = new URL(src);
      if (url.protocol === "https:" && ALLOWED_IMAGE_HOSTS.includes(url.hostname)) {
        return url.toString();
      }
    } catch {
      // Not a valid URL; try the next image.
    }
  }
  return null;
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return errorJson("Method not allowed", 405);

    const parsed = Input.safeParse(await readJson(req));
    if (!parsed.success) return errorJson("Missing gift.", 400, "INVALID_INPUT");

    // RLS: only the user's own suggestions are visible here.
    const { data: suggestion, error } = await ctx.supabase
      .from("gift_suggestions")
      .select("id, title, category, budget_range, shopping_source, image_url")
      .eq("id", parsed.data.suggestionId)
      .maybeSingle();
    if (error) return handleUnexpected(error);
    if (!suggestion) return errorJson("Gift not found.", 404);

    if (suggestion.image_url) return json({ imageUrl: suggestion.image_url });
    if (suggestion.shopping_source !== "amazon") return json({ imageUrl: null });

    let imageUrl: string | null = null;
    try {
      imageUrl = await findAmazonImage(
        buildSearchQuery(suggestion.title, suggestion.category, suggestion.budget_range),
      );
    } catch (lookupError) {
      console.warn("Amazon image lookup failed:", lookupError);
    }

    if (imageUrl) {
      await ctx.supabaseAdmin
        .from("gift_suggestions")
        .update({ image_url: imageUrl })
        .eq("id", suggestion.id);
    }
    return json({ imageUrl });
  }),
};
