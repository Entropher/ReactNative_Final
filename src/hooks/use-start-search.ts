import { router } from 'expo-router';

import { useAllowance, usePreferences } from '@/hooks/use-gift-data';
import { alertOutOfSearches, hasSearchesLeft } from '@/lib/format';
import type { GiftSearch } from '@/lib/types';
import { useSurvey } from '@/providers/survey-provider';

/** Opens the survey: blank, or pre-filled from an earlier search ("Use again"). */
export function useStartSearch() {
  const { data: allowance } = useAllowance();
  const { data: preferences } = usePreferences();
  const survey = useSurvey();

  const startNew = () => {
    if (!hasSearchesLeft(allowance)) return alertOutOfSearches(allowance);
    survey.startNew(preferences?.default_budget);
    router.push('/questionnaire');
  };

  const startFromSearch = (search: GiftSearch) => {
    if (!hasSearchesLeft(allowance)) return alertOutOfSearches(allowance);
    survey.startFromSearch(search);
    // Like the website, jump straight to the last step to review and submit.
    router.push({ pathname: '/questionnaire', params: { step: 'last' } });
  };

  return { startNew, startFromSearch };
}
