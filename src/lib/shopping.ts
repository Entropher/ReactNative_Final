import type { GiftSuggestion } from '@/lib/types';

/** Amazon Associates tag from the website, so purchases still earn commission. */
const AMAZON_AFFILIATE_TAG = 'giftgen-20';

/** Where to buy a gift idea, built the same way as on the website. */
export function getShoppingLink(gift: GiftSuggestion): { url: string; label: string } {
  const budgetUpper = gift.budget_range.split('-').pop()?.trim() ?? '';
  const query = [gift.title, gift.category, budgetUpper].filter(Boolean).join(' ');

  switch (gift.shopping_source) {
    case 'etsy':
      return {
        url: `https://www.etsy.com/search?q=${encodeURIComponent(query)}`,
        label: 'Find on Etsy',
      };
    case 'uncommongood':
      return {
        url: `https://www.uncommongoods.com/search?q=${encodeURIComponent(gift.title)}`,
        label: 'Find on Uncommon Goods',
      };
    default:
      return {
        url: `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_AFFILIATE_TAG}`,
        label: 'Find on Amazon',
      };
  }
}
