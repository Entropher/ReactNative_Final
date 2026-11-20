import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import type { LegalDoc } from '@/lib/legal';

/** A Terms / Privacy page: headings, paragraphs and bullet lists. */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <Screen>
      <AppText variant="caption" tone="muted">
        Last updated: {doc.lastUpdated}
      </AppText>
      {doc.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <AppText variant="subheading">{section.heading}</AppText>
          {section.paragraphs?.map((text) => <AppText key={text}>{text}</AppText>)}
          {section.bullets?.map((text) => (
            <View key={text} style={styles.bullet}>
              <AppText>{'•'}</AppText>
              <AppText style={styles.bulletText}>{text}</AppText>
            </View>
          ))}
          {section.closing ? <AppText>{section.closing}</AppText> : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  bullet: { flexDirection: 'row', gap: Spacing.sm },
  bulletText: { flex: 1 },
});
