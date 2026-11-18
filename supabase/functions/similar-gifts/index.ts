// POST { suggestionId } -> { suggestions }
//
// "More Like This": asks Claude for 5 gifts similar to one the user liked and
// adds them to the same search. Free, but limited to 5 uses per search.
import { withSupabase } from "npm:@supabase/server@1.9.2";
import { z } from "npm:zod@4.6.7";
import { generateSimilarGifts } from "../_shared/gift-ai.ts";
import { errorJson, handleUnexpected, json, readJson } from "../_shared/http.ts";
import { type GiftSearchRow, profileFromSearch } from "../_shared/search-row.ts";

const Input = z.object({ suggestionId: z.uuid() });

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return errorJson("Method not allowed", 405);

    const userId = ctx.userClaims?.id;
    if (!userId) return errorJson("Please sign in again.", 401);

    const parsed = Input.safeParse(await readJson(req));
    if (!parsed.success) return errorJson("Missing gift.", 400, "INVALID_INPUT");

    // Read through the user's own client: RLS only returns their own gifts.
    const { data: reference, error: referenceError } = await ctx.supabase
      .from("gift_suggestions")
      .select("title, description, budget_range, category, search:gift_searches(*)")
      .eq("id", parsed.data.suggestionId)
      .maybeSingle();
    if (referenceError) return handleUnexpected(referenceError);
    if (!reference?.search) return errorJson("Gift not found.", 404);

    const search = reference.search as unknown as GiftSearchRow;

    const { data: claimed, error: claimError } = await ctx.supabaseAdmin.rpc("claim_similar_request", {
      p_search_id: search.id,
      p_user_id: userId,
    });
    if (claimError) return handleUnexpected(claimError);
    if (!claimed) {
      return errorJson(
        "You've reached the limit of 'More Like This' for this search. Start a new search for more ideas.",
        429,
        "SIMILAR_LIMIT",
      );
    }

    try {
      const gifts = await generateSimilarGifts(
        {
          title: reference.title,
          description: reference.description,
          budgetRange: reference.budget_range,
          category: reference.category,
        },
        profileFromSearch(search),
      );

      const { data: inserted, error: insertError } = await ctx.supabaseAdmin
        .from("gift_suggestions")
        .insert(
          gifts.map((gift) => ({
            search_id: search.id,
            title: gift.title,
            description: gift.description,
            budget_range: gift.budgetRange,
            category: gift.category,
            shopping_source: gift.shoppingSource,
          })),
        )
        .select();
      if (insertError) throw insertError;

      return json({ suggestions: inserted });
    } catch (error) {
      await ctx.supabaseAdmin.rpc("release_similar_request", { p_search_id: search.id });
      return handleUnexpected(error);
    }
  }),
};
