// POST { title?, recipientAge, interests, relationship, occasion, budget, ...optional details }
// -> { searchId }
//
// Uses one free search (or credit), asks Claude for 10 gift ideas, and saves
// the search with its suggestions. If anything fails after the free search was
// used, it is given back.
import { withSupabase } from "npm:@supabase/server@1.9.2";
import { z } from "npm:zod@4.6.7";
import { generateGiftSuggestions } from "../_shared/gift-ai.ts";
import { errorJson, handleUnexpected, json, readJson } from "../_shared/http.ts";

const short = z.string().trim().max(200);
const long = z.string().trim().max(1500);

const SearchInput = z.object({
  title: short.optional(),
  recipientAge: short.min(1),
  recipientGender: short.optional(),
  interests: long.min(1),
  relationship: short.min(1),
  occasion: short.min(1),
  budget: short.min(1),
  favoriteColor: short.optional(),
  additionalNotes: long.optional(),
  livingSituation: short.optional(),
  lifeMilestone: short.optional(),
  aesthetic: short.optional(),
  giftType: short.optional(),
  avoidGifts: long.optional(),
  dislikes: long.optional(),
  funnyGiftAcceptable: short.optional(),
  occasionTone: short.optional(),
});

/** Empty optional answers are stored as null. */
const orNull = (value?: string) => (value ? value : null);

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return errorJson("Method not allowed", 405);

    const userId = ctx.userClaims?.id;
    if (!userId) return errorJson("Please sign in again.", 401);

    const parsed = SearchInput.safeParse(await readJson(req));
    if (!parsed.success) {
      return errorJson("Some answers are missing or too long. Please check the survey.", 400, "INVALID_INPUT");
    }
    const input = parsed.data;

    const { data: allowanceKind, error: allowanceError } = await ctx.supabaseAdmin.rpc(
      "consume_search_allowance",
      { p_user_id: userId },
    );
    if (allowanceError) {
      if (allowanceError.message.includes("NO_CREDITS")) {
        return errorJson("You've used all your free searches for this month.", 402, "NO_CREDITS");
      }
      return handleUnexpected(allowanceError);
    }

    try {
      const gifts = await generateGiftSuggestions({
        age: input.recipientAge,
        gender: input.recipientGender,
        interests: input.interests,
        relationship: input.relationship,
        occasion: input.occasion,
        budget: input.budget,
        favoriteColor: input.favoriteColor,
        additionalNotes: input.additionalNotes,
        livingSituation: input.livingSituation,
        lifeMilestone: input.lifeMilestone,
        aesthetic: input.aesthetic,
        giftType: input.giftType,
        avoidGifts: input.avoidGifts,
        dislikes: input.dislikes,
        funnyGiftAcceptable: input.funnyGiftAcceptable,
        occasionTone: input.occasionTone,
      });

      const { data: search, error: searchError } = await ctx.supabaseAdmin
        .from("gift_searches")
        .insert({
          user_id: userId,
          title: input.title || "Gift search",
          recipient_age: input.recipientAge,
          recipient_gender: orNull(input.recipientGender),
          interests: input.interests,
          relationship: input.relationship,
          occasion: input.occasion,
          budget: input.budget,
          favorite_color: orNull(input.favoriteColor),
          additional_notes: orNull(input.additionalNotes),
          living_situation: orNull(input.livingSituation),
          life_milestone: orNull(input.lifeMilestone),
          aesthetic: orNull(input.aesthetic),
          gift_type: orNull(input.giftType),
          avoid_gifts: orNull(input.avoidGifts),
          dislikes: orNull(input.dislikes),
          funny_gift_acceptable: orNull(input.funnyGiftAcceptable),
          occasion_tone: orNull(input.occasionTone),
        })
        .select("id")
        .single();
      if (searchError) throw searchError;

      const { error: suggestionsError } = await ctx.supabaseAdmin.from("gift_suggestions").insert(
        gifts.map((gift) => ({
          search_id: search.id,
          title: gift.title,
          description: gift.description,
          budget_range: gift.budgetRange,
          category: gift.category,
          shopping_source: gift.shoppingSource,
        })),
      );
      if (suggestionsError) {
        await ctx.supabaseAdmin.from("gift_searches").delete().eq("id", search.id);
        throw suggestionsError;
      }

      return json({ searchId: search.id });
    } catch (error) {
      await ctx.supabaseAdmin.rpc("refund_search_allowance", {
        p_user_id: userId,
        p_kind: allowanceKind,
      });
      return handleUnexpected(error);
    }
  }),
};
