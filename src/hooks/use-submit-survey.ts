import { router } from 'expo-router';
import { Alert } from 'react-native';

import { useAllowance, useGenerateGifts } from '@/hooks/use-gift-data';
import { ApiError } from '@/lib/api';
import { alertOutOfSearches } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import { toSubmission, useSurvey, validateStep } from '@/providers/survey-provider';

/** Sends the survey to the AI and opens the results when they're ready. */
export function useSubmitSurvey() {
  const generate = useGenerateGifts();
  const { session } = useAuth();
  const { survey, setResumeAfterSignIn } = useSurvey();
  const { data: allowance } = useAllowance();

  const submit = () => {
    const incomplete = [0, 1, 2].some((step) => Object.keys(validateStep(step, survey)).length > 0);
    if (incomplete) {
      Alert.alert('A few answers are missing', 'Please go back and answer the required questions first.');
      return;
    }

    // Guests can fill in the whole survey, but searching needs an account.
    if (!session) {
      const goTo = (screen: '/sign-up' | '/sign-in') => {
        setResumeAfterSignIn(true);
        router.push(screen);
      };
      Alert.alert(
        'Create a free account to see your gift ideas',
        "Your answers are saved. You'll come right back to them after signing in.",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => goTo('/sign-in') },
          { text: 'Create Account', onPress: () => goTo('/sign-up') },
        ],
      );
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
