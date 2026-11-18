import type { RecipientProfile } from "./gift-ai.ts";

/** A gift_searches row, as stored in the database. */
export interface GiftSearchRow {
  id: string;
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
}

export function profileFromSearch(s: GiftSearchRow): RecipientProfile {
  return {
    age: s.recipient_age,
    gender: s.recipient_gender,
    interests: s.interests,
    relationship: s.relationship,
    occasion: s.occasion,
    budget: s.budget,
    favoriteColor: s.favorite_color,
    additionalNotes: s.additional_notes,
    livingSituation: s.living_situation,
    lifeMilestone: s.life_milestone,
    aesthetic: s.aesthetic,
    giftType: s.gift_type,
    avoidGifts: s.avoid_gifts,
    dislikes: s.dislikes,
    funnyGiftAcceptable: s.funny_gift_acceptable,
    occasionTone: s.occasion_tone,
  };
}
