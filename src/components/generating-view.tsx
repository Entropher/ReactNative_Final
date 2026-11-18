import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { BrandGradient, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Shown while the AI is working on gift ideas. */
export function GeneratingView() {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={BrandGradient} style={styles.badge}>
        <Icon name="sparkles" size={40} color="#FFFFFF" />
      </LinearGradient>
      <AppText variant="heading" style={styles.center}>
        Finding Perfect Gifts...
      </AppText>
      <AppText tone="muted" style={styles.center}>
        Our AI is analyzing the recipient&apos;s profile to generate personalized suggestions.
      </AppText>
      <BouncingDots color={theme.primary} />
    </View>
  );
}

function BouncingDots({ color }: { color: string }) {
  const [dots] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay((2 - index) * 150),
        ]),
      ),
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [dots]);

  return (
    <View style={styles.dots}>
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: color,
              transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  dots: { flexDirection: 'row', gap: Spacing.sm, height: 24, alignItems: 'flex-end' },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
