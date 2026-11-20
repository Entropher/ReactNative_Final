import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GeneratingView } from '@/components/generating-view';
import { Question } from '@/components/question';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipGroup, ChoiceChip } from '@/components/ui/choice-chip';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useSubmitSurvey } from '@/hooks/use-submit-survey';
import {
  AESTHETICS,
  FUNNY_OPTIONS,
  GIFT_TYPES,
  LIFE_MILESTONES,
  LIVING_SITUATIONS,
  OCCASION_TONES,
} from '@/lib/survey-options';
import { type SurveyState, useSurvey } from '@/providers/survey-provider';

type ChoiceField =
  | 'livingSituation'
  | 'lifeMilestone'
  | 'aesthetic'
  | 'giftType'
  | 'funnyGiftAcceptable'
  | 'occasionTone';

/** Optional extra context that helps tailor the suggestions even more. */
export default function MoreDetailsScreen() {
  const { survey, update } = useSurvey();
  const { submit, isPending } = useSubmitSurvey();

  if (isPending) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
        <GeneratingView />
      </>
    );
  }

  // Single-choice question; tapping the chosen answer again clears it.
  const choices = (field: ChoiceField, options: string[]) => (
    <ChipGroup>
      {options.map((option) => (
        <ChoiceChip
          key={option}
          label={option}
          selected={survey[field] === option}
          onPress={() => update({ [field]: survey[field] === option ? '' : option } as Partial<SurveyState>)}
        />
      ))}
    </ChipGroup>
  );

  return (
    <Screen>
      <AppText tone="muted">Optional context that helps tailor the suggestions even more.</AppText>

      <Card style={styles.card}>
        <AppText variant="subheading">About the recipient</AppText>
        <Question title="What's their living situation?">{choices('livingSituation', LIVING_SITUATIONS)}</Question>
        <Question title="Are they going through any life milestone right now?">
          {choices('lifeMilestone', LIFE_MILESTONES)}
        </Question>
        <Question title="What's their general aesthetic?">{choices('aesthetic', AESTHETICS)}</Question>
      </Card>

      <Card style={styles.card}>
        <AppText variant="subheading">About the gift</AppText>
        <Question title="What type of gift do you prefer to give?">{choices('giftType', GIFT_TYPES)}</Question>
        <TextField
          label="Any gifts already given to them that should be avoided?"
          value={survey.avoidGifts}
          onChangeText={(avoidGifts) => update({ avoidGifts })}
          placeholder="e.g., A scarf last year, a coffee maker"
          multiline
        />
        <TextField
          label="Any brands, stores, or things they dislike?"
          value={survey.dislikes}
          onChangeText={(dislikes) => update({ dislikes })}
          placeholder="e.g., Avoids fast fashion, dislikes scented candles"
          multiline
        />
        <Question title="Is a funny or gag gift acceptable?">{choices('funnyGiftAcceptable', FUNNY_OPTIONS)}</Question>
      </Card>

      <Card style={styles.card}>
        <AppText variant="subheading">About the occasion</AppText>
        <Question title="What tone fits this occasion?">{choices('occasionTone', OCCASION_TONES)}</Question>
      </Card>

      <View style={styles.buttons}>
        <Button title="Get Gift Ideas" icon="sparkles" onPress={submit} />
        <Button title="Back to Basic Info" icon="arrowLeft" variant="outline" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.xl },
  buttons: { gap: Spacing.md },
});
