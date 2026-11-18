/** Answer options for the gift survey, the same as on the website. */

export const AGE_GROUPS = [
  { value: '0-5', emoji: '👶' },
  { value: '6-17', emoji: '🧒' },
  { value: '18-25', emoji: '🧑' },
  { value: '26-35', emoji: '👨' },
  { value: '36-50', emoji: '🧔' },
  { value: '51-65', emoji: '👨‍🦳' },
  { value: '65+', emoji: '👴' },
];

export const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export const INTERESTS = [
  'Art',
  'Cooking',
  'Gaming',
  'Travel',
  'Music',
  'Dancing',
  'Sports',
  'Reading',
  'Photography',
  'Tech',
  'Fitness',
  'Gardening',
  'Fashion',
  'Movies',
  'Hiking',
  'Yoga',
  'DIY',
];

export const RELATIONSHIPS = ['Friend', 'Partner', 'Parent', 'Sibling', 'Colleague', 'Other'];

export const COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Yellow', hex: '#FACC15' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Pink', hex: '#F472B6' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
];

export const OCCASIONS = ['Birthday', 'Anniversary', 'Holiday', 'Graduation', 'Other'];

// "Add More Details" page
export const LIVING_SITUATIONS = [
  'Lives alone',
  'Lives with a partner',
  'Lives with family',
  'Has young kids at home',
  'Recently moved',
];

export const LIFE_MILESTONES = [
  'New job',
  'New baby',
  'Retirement',
  'Graduation',
  'Recovery or tough time',
  'None in particular',
];

export const AESTHETICS = [
  'Minimalist',
  'Cozy and warm',
  'Techy and modern',
  'Outdoorsy',
  'Vintage or nostalgic',
  'Artsy and creative',
];

export const GIFT_TYPES = [
  'Physical object',
  'Solo experience or activity',
  'Shared experience or activity',
  'Digital or subscription',
  'Either works',
];

export const FUNNY_OPTIONS = ['Yes', 'No', 'Preferred'];

export const OCCASION_TONES = ['Celebratory', 'Romantic', 'Playful', 'Comforting', 'Appreciative'];

// Budget sliders: $0-$500 in $5 steps. A max of 505 means "No limit".
export const BUDGET_STEP = 5;
export const BUDGET_MAX = 500;
export const BUDGET_NO_LIMIT = 505;
export const DEFAULT_BUDGET = { min: 25, max: 125 };

export function formatBudget(min: number, max: number): string {
  return `$${min} - ${max >= BUDGET_NO_LIMIT ? 'No limit' : `$${max}`}`;
}

/** Reads "$25 - $125" or "$200 - No limit" back into slider values. */
export function parseBudget(budget: string): { min: number; max: number } | null {
  const match = budget.match(/\$(\d+)\s*-\s*(?:\$(\d+)|No limit)/);
  if (!match) return null;
  return { min: Number(match[1]), max: match[2] ? Number(match[2]) : BUDGET_NO_LIMIT };
}

/** The default budget presets offered in Settings, with their slider values. */
export const BUDGET_PRESETS = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $200', min: 100, max: 200 },
  { label: 'Over $200', min: 200, max: BUDGET_NO_LIMIT },
];

export function budgetFromPreset(label: string | null | undefined) {
  const preset = BUDGET_PRESETS.find((p) => p.label === label);
  return preset ? { min: preset.min, max: preset.max } : DEFAULT_BUDGET;
}
