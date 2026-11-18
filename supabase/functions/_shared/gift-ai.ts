// Calls Claude to generate gift ideas. Prompts are carried over from the
// GiftMaster website (server/openai.ts), adapted for structured outputs: the
// API guarantees the reply matches GiftListSchema, so no tool call is needed.
import Anthropic from "npm:@anthropic-ai/sdk@1.4.0";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk@1.4.0/helpers/zod";
import { z } from "npm:zod@4.6.7";

const MODEL = "claude-haiku-5-5";

const GiftSchema = z.object({
  title: z.string(),
  description: z.string(),
  budgetRange: z.string(),
  category: z.string(),
  shoppingSource: z.enum(["amazon", "etsy", "uncommongood"]),
});

const GiftListSchema = z.object({ suggestions: z.array(GiftSchema) });

export type GeneratedGift = z.infer<typeof GiftSchema>;

export interface RecipientProfile {
  age: string;
  gender?: string | null;
  interests: string;
  relationship: string;
  occasion: string;
  budget: string;
  additionalNotes?: string | null;
  favoriteColor?: string | null;
  livingSituation?: string | null;
  lifeMilestone?: string | null;
  aesthetic?: string | null;
  giftType?: string | null;
  avoidGifts?: string | null;
  dislikes?: string | null;
  funnyGiftAcceptable?: string | null;
  occasionTone?: string | null;
}

/** Thrown with a message that is safe to show in the app. */
export class GiftAIError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const SYSTEM_PROMPT =
  "You are a gift advisor who specializes in finding gifts that feel personal and considered. " +
  "Your job is to reason about the recipient as a specific person, not a demographic. " +
  "Think about what would make them feel understood, not just pleased.";

const SHOPPING_SOURCE_RULES = `Choose shoppingSource using these rules:
- "etsy" for anything personalized, handmade, custom, artisan, sentimental, or unique in nature. Examples: custom portraits, engraved items, handmade jewelry, personalized books, art prints, custom home decor.
- "amazon" for anything practical, functional, tech-related, mass-produced, or widely available. Examples: electronics, kitchen appliances, sports gear, gadgets, tools, books, games.
- "uncommongood" for gifts that are quirky, clever, novelty-driven, or curated in nature but not handmade or custom. Examples: unusual kitchen gadgets, conversation-starter games, creative desk accessories, funny but thoughtful items, science or nature themed gifts, unique hobby-related products that would not typically appear on a standard Amazon search.
- When in doubt, default to "amazon".`;

function buildProfilePrompt(p: RecipientProfile): string {
  return `Recipient Profile:
- Age: ${p.age}
- Gender: ${p.gender || "Not specified"}
- Interests: ${p.interests}
- Relationship: ${p.relationship}
- Occasion: ${p.occasion}
- Budget: ${p.budget}
- Favorite Color: ${p.favoriteColor || "Not specified"}
- Living Situation: ${p.livingSituation || "Not specified"}
- Current Life Milestone: ${p.lifeMilestone || "Not specified"}
- General Aesthetic: ${p.aesthetic || "Not specified"}
- Preferred Gift Type: ${p.giftType || "Not specified"}
- Gifts Already Given (avoid): ${p.avoidGifts || "None"}
- Brands/Stores/Things They Dislike: ${p.dislikes || "None"}
- Funny or Gag Gift Acceptable: ${p.funnyGiftAcceptable || "Not specified"}
- Tone for the Occasion: ${p.occasionTone || "Not specified"}
- Additional Notes: ${p.additionalNotes || "None"}`;
}

let client: Anthropic | undefined;

function getClient(): Anthropic {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set for Edge Functions.");
    throw new GiftAIError("Gift ideas are unavailable right now. Please try again later.", 500);
  }
  client ??= new Anthropic({ apiKey });
  return client;
}

async function askClaude(prompt: string): Promise<GeneratedGift[]> {
  let response;
  try {
    response = await getClient().messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
      output_config: {
        effort: "medium",
        format: zodOutputFormat(GiftListSchema),
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      throw new GiftAIError("Our gift AI is busy right now. Please try again in a minute.", 503);
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic rejected the API key:", error.message);
      throw new GiftAIError("Gift ideas are unavailable right now. Please try again later.", 500);
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      throw new GiftAIError("Couldn't generate gift ideas. Please try again.", 502);
    }
    throw error;
  }

  if (response.stop_reason === "refusal") {
    throw new GiftAIError(
      "We couldn't generate ideas for this request. Try changing some of the details.",
      422,
    );
  }
  const suggestions = response.parsed_output?.suggestions ?? [];
  if (suggestions.length === 0) {
    console.error("Claude returned no parsable suggestions. stop_reason:", response.stop_reason);
    throw new GiftAIError("Couldn't generate gift ideas. Please try again.", 502);
  }
  return suggestions;
}

export async function generateGiftSuggestions(profile: RecipientProfile): Promise<GeneratedGift[]> {
  const prompt = `${buildProfilePrompt(profile)}

Return exactly 10 suggestions. Each suggestion must include:
- title
- description (2–3 sentences)
- budgetRange (e.g., "$25-$50")
- category (e.g., "Electronics", "Books", "Experiences")
- shoppingSource (one of "amazon", "etsy", or "uncommongood")

Rules you must follow:
- Every budgetRange must fall within the stated budget. Do not suggest anything outside it.
- Each suggestion must connect clearly to at least one profile field. Generic gifts that could apply to any person are not acceptable.
- ${SHOPPING_SOURCE_RULES}`;

  const suggestions = await askClaude(prompt);
  return suggestions.slice(0, 10);
}

export async function generateSimilarGifts(
  reference: { title: string; description: string; budgetRange: string; category?: string | null },
  profile: RecipientProfile,
): Promise<GeneratedGift[]> {
  const prompt = `${buildProfilePrompt(profile)}

A user liked this gift:
- Title: ${reference.title}
- Description: ${reference.description}
- Category: ${reference.category || "N/A"}
- Budget: ${reference.budgetRange}

Suggest 5 MORE gift ideas that are similar in style, theme, or category. Do not repeat the gift above.

Each suggestion must include title, description (2–3 sentences), budgetRange, category, and shoppingSource.

${SHOPPING_SOURCE_RULES}`;

  const suggestions = await askClaude(prompt);
  return suggestions.slice(0, 5);
}
