/** Rows as they come back from the Supabase database. */

export type ShoppingSource = 'amazon' | 'etsy' | 'uncommongood';

export interface GiftSearch {
  id: string;
  title: string;
  recipient_age: string;
  recipient_gender: string | null;
  interests: string;
  relationship: string;
  occasion: string;
  budget: string;
  favorite_color: string | null;
  additional_notes: string | null;
  living_situation: string | null;
  life_milestone: string | null;
  aesthetic: string | null;
  gift_type: string | null;
  avoid_gifts: string | null;
  dislikes: string | null;
  funny_gift_acceptable: string | null;
  occasion_tone: string | null;
  similar_requests: number;
  created_at: string;
}

export interface GiftSuggestion {
  id: string;
  search_id: string;
  title: string;
  description: string;
  budget_range: string;
  category: string | null;
  shopping_source: ShoppingSource;
  image_url: string | null;
  created_at: string;
}

export interface SavedGift {
  id: string;
  suggestion_id: string;
  created_at: string;
  suggestion: GiftSuggestion;
}

export interface Allowance {
  free_remaining: number;
  free_limit: number;
  credits: number;
  resets_at: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Preferences {
  theme: ThemePreference;
  default_budget: string | null;
}

/** What the app sends to the generate-gifts function. */
export interface SurveyAnswers {
  title: string;
  recipientAge: string;
  recipientGender?: string;
  interests: string;
  relationship: string;
  occasion: string;
  budget: string;
  favoriteColor?: string;
  additionalNotes?: string;
  livingSituation?: string;
  lifeMilestone?: string;
  aesthetic?: string;
  giftType?: string;
  avoidGifts?: string;
  dislikes?: string;
  funnyGiftAcceptable?: string;
  occasionTone?: string;
}
