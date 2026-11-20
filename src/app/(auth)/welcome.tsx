import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BrandHero } from '@/components/brand-hero';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSurvey } from '@/providers/survey-provider';

const STEPS: { icon: IconName; title: string; text: string; color: 'primary' | 'secondary' | 'accent' }[] = [
  {
    icon: 'tune',
    title: 'Answer Questions',
    text: 'Tell us about the recipient: their age, interests, relationship, and budget.',
    color: 'primary',
  },
  {
    icon: 'sparkles',
    title: 'AI Analysis',
    text: 'Our AI analyzes the information to generate personalized gift suggestions.',
    color: 'secondary',
  },
  {
    icon: 'heart',
    title: 'Get Suggestions',
    text: "Browse gift ideas, save your favorites, and make someone's day special.",
    color: 'accent',
  },
];

export default function WelcomeScreen() {
  const theme = useTheme();
  const survey = useSurvey();

  // Guests can go through the whole survey; signing in is asked for at the end.
  const tryGiftSearch = () => {
    survey.startNew();
    router.push('/questionnaire');
  };

  return (
    <Screen withTopInset>
      <BrandHero style={styles.hero}>
        <Icon name="gift" size={44} color="#FFFFFF" />
        <AppText variant="title" tone="onPrimary">
          Find the Perfect Gift with AI
        </AppText>
        <AppText tone="onPrimary" style={styles.heroText}>
          Get personalized gift suggestions powered by AI. Answer a few simple questions and discover
          thoughtful presents for any occasion.
        </AppText>
      </BrandHero>

      <View style={styles.buttons}>
        <Button title="Get Started" icon="arrowRight" iconPosition="right" onPress={() => router.push('/sign-up')} />
        <Button title="Try a Gift Search" icon="sparkles" variant="outline" onPress={tryGiftSearch} />
        <Button title="I already have an account" variant="ghost" onPress={() => router.push('/sign-in')} />
      </View>

      <AppText variant="heading">How It Works</AppText>
      {STEPS.map((step) => (
        <Card key={step.title} style={styles.step}>
          <View style={[styles.stepIcon, { backgroundColor: theme[`${step.color}Soft`] }]}>
            <Icon name={step.icon} size={24} color={theme[step.color]} />
          </View>
          <View style={styles.stepText}>
            <AppText variant="label">{step.title}</AppText>
            <AppText variant="caption" tone="muted">
              {step.text}
            </AppText>
          </View>
        </Card>
      ))}

      <View style={styles.legal}>
        <Button title="Terms" variant="ghost" size="sm" onPress={() => router.push('/terms')} />
        <Button title="Privacy Policy" variant="ghost" size="sm" onPress={() => router.push('/privacy')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingVertical: Spacing.xxl },
  heroText: { opacity: 0.95 },
  buttons: { gap: Spacing.md },
  step: { flexDirection: 'row', alignItems: 'center' },
  stepIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, gap: 2 },
  legal: { flexDirection: 'row', justifyContent: 'center' },
});
