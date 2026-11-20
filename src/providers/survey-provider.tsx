import { createContext, useContext, useState } from 'react';

import {
  budgetFromPreset,
  COLORS,
  formatBudget,
  INTERESTS,
  OCCASIONS,
  parseBudget,
} from '@/lib/survey-options';
import type { GiftSearch, SurveyAnswers } from '@/lib/types';

/** Everything the user has answered so far, across both survey screens. */
export interface SurveyState {
  title: string;
  recipientAge: string;
  recipientGender: string;
  interestChoices: string[];
  interestsText: string;
  relationship: string;
  favoriteColors: string[];
  occasion: string;
  occasionOther: string;
  budgetMin: number;
  budgetMax: number;
  additionalNotes: string;
  // "Add More Details"
  livingSituation: string;
  lifeMilestone: string;
  aesthetic: string;
  giftType: string;
  avoidGifts: string;
  dislikes: string;
  funnyGiftAcceptable: string;
  occasionTone: string;
}

function emptySurvey(defaultBudget?: string | null): SurveyState {
  const budget = budgetFromPreset(defaultBudget);
  return {
    title: '',
    recipientAge: '',
    recipientGender: '',
    interestChoices: [],
    interestsText: '',
    relationship: '',
    favoriteColors: [],
    occasion: 'Birthday',
    occasionOther: '',
    budgetMin: budget.min,
    budgetMax: budget.max,
    additionalNotes: '',
    livingSituation: '',
    lifeMilestone: '',
    aesthetic: '',
    giftType: '',
    avoidGifts: '',
    dislikes: '',
    funnyGiftAcceptable: '',
    occasionTone: '',
  };
}

const splitList = (text: string | null) =>
  (text ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/** Turns a saved search back into survey answers ("Use again"). */
function surveyFromSearch(search: GiftSearch): SurveyState {
  const interests = splitList(search.interests);
  const knownOccasion = OCCASIONS.includes(search.occasion) && search.occasion !== 'Other';
  const budget = parseBudget(search.budget);
  const colorNames = COLORS.map((c) => c.name);
  return {
    ...emptySurvey(),
    title: search.title,
    recipientAge: search.recipient_age,
    recipientGender: search.recipient_gender ?? '',
    interestChoices: interests.filter((i) => INTERESTS.includes(i)),
    interestsText: interests.filter((i) => !INTERESTS.includes(i)).join(', '),
    relationship: search.relationship,
    favoriteColors: splitList(search.favorite_color).filter((c) => colorNames.includes(c)),
    occasion: knownOccasion ? search.occasion : 'Other',
    occasionOther: knownOccasion ? '' : search.occasion,
    budgetMin: budget?.min ?? emptySurvey().budgetMin,
    budgetMax: budget?.max ?? emptySurvey().budgetMax,
    additionalNotes: search.additional_notes ?? '',
    livingSituation: search.living_situation ?? '',
    lifeMilestone: search.life_milestone ?? '',
    aesthetic: search.aesthetic ?? '',
    giftType: search.gift_type ?? '',
    avoidGifts: search.avoid_gifts ?? '',
    dislikes: search.dislikes ?? '',
    funnyGiftAcceptable: search.funny_gift_acceptable ?? '',
    occasionTone: search.occasion_tone ?? '',
  };
}

export function combinedInterests(s: SurveyState): string {
  return [...s.interestChoices, ...splitList(s.interestsText)].join(', ');
}

export function occasionLabel(s: SurveyState): string {
  return s.occasion === 'Other' ? s.occasionOther.trim() || 'Other' : s.occasion;
}

/** Problems that stop the user from leaving a survey step, keyed by field. */
export function validateStep(step: number, s: SurveyState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 0 && !s.recipientAge) errors.recipientAge = 'Please choose an age group.';
  if (step === 1) {
    if (!combinedInterests(s)) errors.interests = 'Pick at least one interest or type one in.';
    if (!s.relationship) errors.relationship = 'Please choose your relationship.';
  }
  return errors;
}

/** The answers in the shape the generate-gifts function expects. */
export function toSubmission(s: SurveyState): SurveyAnswers {
  const title =
    s.title.trim() ||
    new Date().toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  return {
    title,
    recipientAge: s.recipientAge,
    recipientGender: s.recipientGender || undefined,
    interests: combinedInterests(s),
    relationship: s.relationship,
    occasion: occasionLabel(s),
    budget: formatBudget(s.budgetMin, s.budgetMax),
    favoriteColor: s.favoriteColors.join(', ') || undefined,
    additionalNotes: s.additionalNotes.trim() || undefined,
    livingSituation: s.livingSituation || undefined,
    lifeMilestone: s.lifeMilestone || undefined,
    aesthetic: s.aesthetic || undefined,
    giftType: s.giftType || undefined,
    avoidGifts: s.avoidGifts.trim() || undefined,
    dislikes: s.dislikes.trim() || undefined,
    funnyGiftAcceptable: s.funnyGiftAcceptable || undefined,
    occasionTone: s.occasionTone || undefined,
  };
}

type SurveyContextValue = {
  survey: SurveyState;
  update: (changes: Partial<SurveyState>) => void;
  /** Fresh survey, using the default budget from Settings. */
  startNew: (defaultBudget?: string | null) => void;
  startFromSearch: (search: GiftSearch) => void;
  /** A guest tapped "Get Gift Ideas"; reopen their answers once they're signed in. */
  resumeAfterSignIn: boolean;
  setResumeAfterSignIn: (value: boolean) => void;
};

const SurveyContext = createContext<SurveyContextValue | null>(null);

export function useSurvey(): SurveyContextValue {
  const value = useContext(SurveyContext);
  if (!value) throw new Error('useSurvey must be used inside <SurveyProvider>.');
  return value;
}

export function SurveyProvider({ children }: { children: React.ReactNode }) {
  const [survey, setSurvey] = useState<SurveyState>(() => emptySurvey());
  const [resumeAfterSignIn, setResumeAfterSignIn] = useState(false);

  const value: SurveyContextValue = {
    survey,
    update: (changes) => setSurvey((current) => ({ ...current, ...changes })),
    startNew: (defaultBudget) => setSurvey(emptySurvey(defaultBudget)),
    startFromSearch: (search) => setSurvey(surveyFromSearch(search)),
    resumeAfterSignIn,
    setResumeAfterSignIn,
  };

  return <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>;
}
