import { router } from 'expo-router';
import { Alert } from 'react-native';

import { useAllowance, useGenerateGifts } from '@/hooks/use-gift-data';
import { ApiError } from '@/lib/api';
import { alertOutOfSearches } from '@/lib/format';
import { toSubmission, useSurvey, validateStep } from '@/providers/survey-provider';

/** Sends the survey to the AI and opens the results when they're ready. */
export function useSubmitSurvey() {
  const generate = useGenerateGifts();
  const { survey } = useSurvey();
  const { data: allowance } = useAllowance();

  const submit = () => {
    const incomplete = [0, 1, 2].some((step) => Object.keys(validateStep(step, survey)).length > 0);
    if (incomplete) {
      Alert.alert('A few answers are missing', 'Please go back and answer the required questions first.');
      return;
    }

    generate.mutate(toSubmission(survey), {
      onSuccess: ({ searchId }) => {
        // Close the survey screens so "back" from the results goes Home.
        router.dismissAll();
        router.push({ pathname: '/results/[id]', params: { id: searchId } });
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === 'NO_CREDITS') {
          alertOutOfSearches(allowance);
        } else {
          Alert.alert("Couldn't get gift ideas", error.message);
        }
      },
    });
  };

  return { submit, isPending: generate.isPending };
}
