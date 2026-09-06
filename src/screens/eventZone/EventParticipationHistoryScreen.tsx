import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventHistoryCard } from '../../components/eventZone/EventHistoryCard';
import { EventNavHeader } from '../../components/eventZone/EventNavHeader';
import { EVENT_ZONE_BY_ID, eventZoneName } from '../../constants/eventZone/eventZone';
import { useEventParticipationHistory } from '../../hooks/eventZone/useEventParticipationHistory';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import {
  formatParticipationTimestamp,
  participationStatusLabel,
} from '../../utils/eventZone/participationLabels';
import type { EventParticipationRecord, EventParticipationStatus } from '../../types/eventParticipation';

type Props = NativeStackScreenProps<RootStackParamList, 'EventParticipationHistory'>;

function resultToneForStatus(
  status: EventParticipationStatus,
): 'primary' | 'warning' | 'danger' | 'muted' {
  if (status === 'approved') return 'primary';
  if (status === 'rejected') return 'danger';
  if (status === 'pending_review') return 'warning';
  return 'muted';
}

export function EventParticipationHistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('eventGame');
  const { records, loading, refreshing, loadingMore, refresh, loadMore } =
    useEventParticipationHistory();

  const renderItem = useMemo(
    () =>
      function HistoryItem({ item }: { item: EventParticipationRecord }) {
        const zone = EVENT_ZONE_BY_ID[item.zoneId];
        if (!zone) {
          return null;
        }
        const statusLabel = participationStatusLabel(item.status, copy);
        const typeLabel =
          item.eventType === 'PLACE_AUTH' ? copy.typePlaceAuth : copy.typeObjectSight;
        const timestamp = formatParticipationTimestamp(
          item.submittedAt ?? item.createdAt,
          language,
        );
        const timestampLabel = timestamp
          ? item.submittedAt
            ? copy.historySubmittedAt(timestamp)
            : copy.historyStartedAt(timestamp)
          : undefined;

        return (
          <EventHistoryCard
            title={item.eventTitleKo}
            zoneName={eventZoneName(zone, language)}
            result={typeLabel}
            status={item.status}
            statusLabel={statusLabel}
            timestamp={timestampLabel}
            resultTone={resultToneForStatus(item.status)}
            onPress={() =>
              navigation.navigate('EventGameDetail', { eventId: item.eventId })
            }
          />
        );
      },
    [copy, language, navigation],
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingTop: insets.top }}>
      <View className="border-b border-[#E2E8F0] bg-white px-2">
        <EventNavHeader
          title={copy.historyTitle}
          onBack={() => navigation.goBack()}
          backAccessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          rightAccessory={undefined}
        />
      </View>

      {loading && records.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : records.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm leading-relaxed text-[#64748B]">
            {copy.historyEmpty}
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
          }
          onEndReached={() => {
            void loadMore();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4">
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
