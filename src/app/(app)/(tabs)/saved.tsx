import { ActivityIndicator, Alert } from 'react-native';

import { GiftCard } from '@/components/gift-card';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { useSavedGifts, useToggleSaved } from '@/hooks/use-gift-data';
import { useTheme } from '@/hooks/use-theme';

export default function SavedScreen() {
  const theme = useTheme();
  const { data: savedGifts, isLoading } = useSavedGifts();
  const toggleSaved = useToggleSaved();

  return (
    <Screen withTopInset>
      <AppText variant="title">Saved Gifts</AppText>

      {isLoading ? <ActivityIndicator color={theme.primary} /> : null}

      {savedGifts?.length === 0 ? (
        <Card>
          <AppText variant="subheading">No saved gifts yet</AppText>
          <AppText tone="muted">Tap the heart on any gift idea to keep it here.</AppText>
        </Card>
      ) : null}

      {savedGifts?.map((saved) => (
        <GiftCard
          key={saved.id}
          gift={saved.suggestion}
          saved
          onToggleSave={() =>
            toggleSaved.mutate(
              { suggestionId: saved.suggestion_id, save: false },
              { onError: (error) => Alert.alert("Couldn't remove gift", error.message) },
            )
          }
        />
      ))}
    </Screen>
  );
}
