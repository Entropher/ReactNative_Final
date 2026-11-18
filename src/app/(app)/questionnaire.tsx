import Slider from '@react-native-community/slider';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GeneratingView } from '@/components/generating-view';
import { Question } from '@/components/question';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipGroup, ChoiceChip } from '@/components/ui/choice-chip';
import { Icon } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useSubmitSurvey } from '@/hooks/use-submit-survey';
import { useTheme } from '@/hooks/use-theme';
import {
  AGE_GROUPS,
  BUDGET_MAX,
  BUDGET_NO_LIMIT,
  BUDGET_STEP,
  COLORS,
  formatBudget,
  GENDERS,
  INTERESTS,
  OCCASIONS,
  RELATIONSHIPS,
} from '@/lib/survey-options';
import { combinedInterests, occasionLabel, useSurvey, validateStep } from '@/providers/survey-provider';

const STEPS = ['Basic Info', 'Interests', 'Details', 'Final Notes'];
const LAST_STEP = STEPS.length - 1;

/** Adds the item to the list, or removes it if it's already there. */
const toggle = (list: string[], item: string) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

export default function QuestionnaireScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ step?: string }>();
  const [step, setStep] = useState(params.step === 'last' ? LAST_STEP : 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const next = () => {
    const found = validateStep(step, survey);
    setErrors(found);
    if (Object.keys(found).length === 0) setStep(step + 1);
  };

  const back = () => {
    setErrors({});
    setStep(step - 1);
  };

  return (
    <Screen>
      <View style={styles.progressHeader}>
        <AppText variant="heading">{STEPS[step]}</AppText>
        <AppText variant="caption" tone="muted">
          Step {step + 1} of {STEPS.length}
        </AppText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.border }]}>
        <View
          style={[styles.fill, { backgroundColor: theme.primary, width: `${((step + 1) / STEPS.length) * 100}%` }]}
        />
      </View>

      <Card style={styles.card}>
        {step === 0 ? (
          <>
            <TextField
              label="What should we call this search?"
              value={survey.title}
              onChangeText={(title) => update({ title })}
              placeholder="e.g., Birthday gift for my best friend"
            />
            <Question title="How old is the recipient?" error={errors.recipientAge}>
              <ChipGroup>
                {AGE_GROUPS.map((age) => (
                  <ChoiceChip
                    key={age.value}
                    label={age.value}
                    emoji={age.emoji}
                    selected={survey.recipientAge === age.value}
                    onPress={() => update({ recipientAge: age.value })}
                  />
                ))}
              </ChipGroup>
            </Question>
            <Question title="Gender (optional)">
              <ChipGroup>
                {GENDERS.map((gender) => (
                  <ChoiceChip
                    key={gender}
                    label={gender}
                    selected={survey.recipientGender === gender}
                    onPress={() =>
                      update({ recipientGender: survey.recipientGender === gender ? '' : gender })
                    }
                  />
                ))}
              </ChipGroup>
            </Question>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Question title="What are their interests or hobbies?" error={errors.interests}>
              <ChipGroup>
                {INTERESTS.map((interest) => (
                  <ChoiceChip
                    key={interest}
                    label={interest}
                    selected={survey.interestChoices.includes(interest)}
                    onPress={() => update({ interestChoices: toggle(survey.interestChoices, interest) })}
                  />
                ))}
              </ChipGroup>
              <TextField
                value={survey.interestsText}
                onChangeText={(interestsText) => update({ interestsText })}
                placeholder="Add any other interests not listed above..."
                hint="Pick from the options above and/or type more, separated by commas."
              />
            </Question>
            <Question title="What's your relationship to them?" error={errors.relationship}>
              <ChipGroup>
                {RELATIONSHIPS.map((relationship) => (
                  <ChoiceChip
                    key={relationship}
                    label={relationship}
                    selected={survey.relationship === relationship}
                    onPress={() => update({ relationship })}
                  />
                ))}
              </ChipGroup>
            </Question>
            <Question title="Favorite colors (optional)">
              <View style={styles.swatches}>
                {COLORS.map((color) => {
                  const selected = survey.favoriteColors.includes(color.name);
                  return (
                    <Pressable
                      key={color.name}
                      accessibilityRole="button"
                      accessibilityLabel={color.name}
                      accessibilityState={{ selected }}
                      onPress={() => update({ favoriteColors: toggle(survey.favoriteColors, color.name) })}
                      style={styles.swatchItem}>
                      <View
                        style={[
                          styles.swatch,
                          { backgroundColor: color.hex, borderColor: selected ? theme.primary : theme.border },
                          selected && styles.swatchSelected,
                        ]}>
                        {selected ? (
                          <Icon name="check" size={16} color={color.name === 'White' || color.name === 'Yellow' ? '#000' : '#FFF'} />
                        ) : null}
                      </View>
                      <AppText variant="caption" tone="muted">
                        {color.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </Question>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Question title="What's the occasion?">
              <ChipGroup>
                {OCCASIONS.map((occasion) => (
                  <ChoiceChip
                    key={occasion}
                    label={occasion}
                    selected={survey.occasion === occasion}
                    onPress={() => update({ occasion })}
                  />
                ))}
              </ChipGroup>
              {survey.occasion === 'Other' ? (
                <TextField
                  value={survey.occasionOther}
                  onChangeText={(occasionOther) => update({ occasionOther })}
                  placeholder="e.g., Housewarming, Baby Shower, Retirement..."
                />
              ) : null}
            </Question>
            <Question title="Budget range">
              <AppText variant="heading" tone="primary">
                {formatBudget(survey.budgetMin, survey.budgetMax)}
              </AppText>
              <AppText variant="caption" tone="muted">
                Minimum
              </AppText>
              <Slider
                minimumValue={0}
                maximumValue={BUDGET_MAX}
                step={BUDGET_STEP}
                value={survey.budgetMin}
                onValueChange={(value) =>
                  update({ budgetMin: Math.min(value, Math.min(survey.budgetMax, BUDGET_MAX) - BUDGET_STEP) })
                }
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.primary}
              />
              <AppText variant="caption" tone="muted">
                Maximum (slide all the way right for no limit)
              </AppText>
              <Slider
                minimumValue={0}
                maximumValue={BUDGET_NO_LIMIT}
                step={BUDGET_STEP}
                value={survey.budgetMax}
                onValueChange={(value) => update({ budgetMax: Math.max(value, survey.budgetMin + BUDGET_STEP) })}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.primary}
              />
            </Question>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <TextField
              label="Anything else we should know?"
              value={survey.additionalNotes}
              onChangeText={(additionalNotes) => update({ additionalNotes })}
              placeholder="Any specific preferences, allergies, dislikes, or special considerations..."
              multiline
            />
            <View style={[styles.summary, { backgroundColor: theme.muted }]}>
              <AppText variant="label">Summary</AppText>
              <SummaryLine label="Search" value={survey.title || 'Named after today’s date'} />
              <SummaryLine label="Recipient" value={`Age ${survey.recipientAge}, ${survey.relationship}`} />
              <SummaryLine label="Interests" value={combinedInterests(survey)} />
              <SummaryLine
                label="Budget"
                value={`${formatBudget(survey.budgetMin, survey.budgetMax)} for ${occasionLabel(survey)}`}
              />
            </View>
          </>
        ) : null}
      </Card>

      {step === LAST_STEP ? (
        <View style={styles.finalButtons}>
          <Button title="Get Gift Ideas" icon="sparkles" onPress={submit} />
          <Button
            title="Add More Details"
            icon="plus"
            variant="outline"
            onPress={() => router.push('/more-details')}
          />
          <Button title="Previous" icon="arrowLeft" variant="ghost" onPress={back} />
        </View>
      ) : (
        <View style={styles.navButtons}>
          <Button
            title="Previous"
            icon="arrowLeft"
            variant="outline"
            disabled={step === 0}
            onPress={back}
            style={styles.flex}
          />
          <Button title="Next" icon="arrowRight" iconPosition="right" onPress={next} style={styles.flex} />
        </View>
      )}
    </Screen>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <AppText variant="caption" tone="muted" numberOfLines={2}>
      <AppText variant="caption" style={{ fontWeight: '700' }}>
        {label}:{' '}
      </AppText>
      {value}
    </AppText>
  );
}

const styles = StyleSheet.create({
  progressHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  track: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  card: { gap: Spacing.xl },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  swatchItem: { alignItems: 'center', gap: Spacing.xs, width: 56 },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: { borderWidth: 3 },
  summary: { borderRadius: Radius.md, padding: Spacing.lg, gap: Spacing.xs },
  finalButtons: { gap: Spacing.md },
  navButtons: { flexDirection: 'row', gap: Spacing.md },
  flex: { flex: 1 },
});
