import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventHistoryCard } from '../../components/eventZone/EventHistoryCard';
import { EventNavHeader } from '../../components/eventZone/EventNavHeader';
import {
  BRAND_BORDER,
  BRAND_PRIMARY,
  BRAND_TEXT,
} from '../../components/eventZone/eventZoneTheme';
import { EVENT_ZONES, EVENT_ZONE_BY_ID, eventZoneName } from '../../constants/eventZone/eventZone';
import {
  useEventParticipationHistory,
  type HistoryEventTypeFilter,
} from '../../hooks/eventZone/useEventParticipationHistory';
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

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className="rounded-full px-3.5 py-2 active:opacity-80"
      style={{
        backgroundColor: active ? BRAND_PRIMARY : '#FFFFFF',
        borderWidth: 1,
        borderColor: active ? BRAND_PRIMARY : BRAND_BORDER,
      }}>
      <Text className="text-[12px] font-bold" style={{ color: active ? '#FFFFFF' : BRAND_TEXT }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EventParticipationHistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('eventGame');
  const {
    records,
    filters,
    hasActiveFilters,
    setZoneFilter,
    setTypeFilter,
    setStatusFilter,
    loading,
    refreshing,
    loadingMore,
    refresh,
    loadMore,
  } = useEventParticipationHistory();

  const statusChips: { key: EventParticipationStatus | undefined; label: string }[] = [
    { key: undefined, label: copy.historyFilterAll },
    { key: 'in_progress', label: copy.statusInProgress },
    { key: 'pending_review', label: copy.statusPendingReview },
    { key: 'approved', label: copy.statusCompleted },
    { key: 'rejected', label: copy.statusRejected },
  ];

  const typeChips: { key: HistoryEventTypeFilter | undefined; label: string }[] = [
    { key: undefined, label: copy.historyFilterAll },
    { key: 'PLACE_AUTH', label: copy.typePlaceAuth },
    { key: 'OBJECT_AUTH', label: copy.typeObjectSight },
  ];

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

        const noteParts = [
          item.rejectionReason,
          item.canResubmit ? copy.historyCanResubmit : undefined,
        ].filter((part): part is string => Boolean(part));

        return (
          <EventHistoryCard
            title={item.eventTitleKo}
            zoneName={eventZoneName(zone, language)}
            result={typeLabel}
            note={noteParts.length > 0 ? noteParts.join(' · ') : undefined}
            status={item.status}
            statusLabel={statusLabel}
            timestamp={timestampLabel}
            resultTone={resultToneForStatus(item.status)}
            noteTone={item.rejectionReason ? 'danger' : item.canResubmit ? 'warning' : 'muted'}
            onPress={() =>
              navigation.navigate('EventGameDetail', { eventId: item.eventId })
            }
          />
        );
      },
    [copy, language, navigation],
  );

  const listHeader = (
    <View className="gap-3 pb-2">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {statusChips.map(item => (
          <FilterChip
            key={item.key ?? 'status-all'}
            label={item.label}
            active={filters.status === item.key}
            onPress={() => setStatusFilter(item.key)}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {typeChips.map(item => (
          <FilterChip
            key={item.key ?? 'type-all'}
            label={item.label}
            active={filters.type === item.key}
            onPress={() => setTypeFilter(item.key)}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <FilterChip
          label={copy.historyFilterAll}
          active={filters.zone == null}
          onPress={() => setZoneFilter(undefined)}
        />
        {EVENT_ZONES.map(zone => (
          <FilterChip
            key={zone.id}
            label={eventZoneName(zone, language)}
            active={filters.zone === zone.id}
            onPress={() => setZoneFilter(zone.id)}
          />
        ))}
      </ScrollView>
    </View>
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

      <View className="border-b border-[#E2E8F0] bg-white px-4 py-3">{listHeader}</View>

      {loading && records.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text className="px-0.5 py-8 text-center text-sm leading-relaxed text-[#64748B]">
              {hasActiveFilters ? copy.historyFilterEmpty : copy.historyEmpty}
            </Text>
          }
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
            gap: 10,
            flexGrow: 1,
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
