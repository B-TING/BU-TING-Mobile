import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventChip } from '../../components/eventZone/EventChip';
import { EventInfoCard } from '../../components/eventZone/EventInfoCard';
import { EventNavHeader } from '../../components/eventZone/EventNavHeader';
import { EventStatusBadge } from '../../components/eventZone/EventStatusBadge';
import {
  BRAND_BORDER,
  BRAND_MUTED,
  BRAND_PRIMARY,
  BRAND_TEXT,
  FEEDBACK_GREEN,
  FEEDBACK_RED,
} from '../../components/eventZone/eventZoneTheme';
import { EVENT_ZONE_BY_ID, eventZoneName } from '../../constants/eventZone/eventZone';
import { useEventRewardsScreen } from '../../hooks/eventZone/useEventRewardsScreen';
import { useAppLanguage } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import type { PointLedgerItem } from '../../types/userRewardsApi';
import { formatParticipationTimestamp } from '../../utils/eventZone/participationLabels';
import { isEventZoneId } from '../../services/eventZone/zoneEventMapper';

type Props = NativeStackScreenProps<RootStackParamList, 'EventRewards'>;

function ledgerReasonLabel(
  reason: string,
  copy: {
    reasons: {
      BASE: string;
      TOP_LIKE: string;
      ZONE_WIN: string;
      TOP_RANK: string;
      REVOKE: string;
      other: (code: string) => string;
    };
  },
): string {
  if (reason === 'BASE') return copy.reasons.BASE;
  if (reason === 'TOP_LIKE') return copy.reasons.TOP_LIKE;
  if (reason === 'ZONE_WIN') return copy.reasons.ZONE_WIN;
  if (reason === 'TOP_RANK') return copy.reasons.TOP_RANK;
  if (reason === 'REVOKE') return copy.reasons.REVOKE;
  return copy.reasons.other(reason);
}

function LedgerRow({
  item,
  copy,
  timestamp,
}: {
  item: PointLedgerItem;
  copy: ReturnType<typeof useEventRewardsScreen>['copy'];
  timestamp: string;
}) {
  const credit = item.amount >= 0;
  return (
    <View className="gap-1.5 rounded-2xl border bg-white p-3.5" style={{ borderColor: BRAND_BORDER }}>
      <View className="flex-row items-start justify-between gap-2">
        <Text className="min-w-0 flex-1 text-[14px] font-bold leading-5" style={{ color: BRAND_TEXT }}>
          {ledgerReasonLabel(item.reason, copy)}
        </Text>
        <EventStatusBadge
          label={credit ? copy.ledgerCredit : copy.ledgerDebit}
          status={credit ? 'approved' : 'rejected'}
        />
      </View>
      <Text
        className="text-[13px] font-bold leading-[18px]"
        style={{ color: credit ? FEEDBACK_GREEN : FEEDBACK_RED }}>
        {credit ? copy.amountCredit(item.amount) : copy.amountDebit(Math.abs(item.amount))}
      </Text>
      {timestamp ? (
        <Text className="text-[11px]" style={{ color: BRAND_MUTED }}>
          {timestamp}
        </Text>
      ) : null}
    </View>
  );
}

export function EventRewardsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const {
    copy,
    isAuthenticated,
    summary,
    ledger,
    loading,
    refreshing,
    loadingMore,
    refresh,
    loadMore,
    goBack,
    goLogin,
  } = useEventRewardsScreen(navigation);

  const listHeader = useMemo(
    () => (
      <View className="gap-4 pb-2">
        <EventInfoCard
          label={copy.pointBalanceLabel}
          title={copy.pointBalanceValue(summary.pointBalance)}
          tone="success"
        />

        <View className="gap-2">
          <Text className="px-0.5 text-[13px] font-bold" style={{ color: BRAND_TEXT }}>
            {copy.badgesTitle}
          </Text>
          {summary.badges.length === 0 ? (
            <Text className="px-0.5 text-[13px] leading-5" style={{ color: BRAND_MUTED }}>
              {copy.badgesEmpty}
            </Text>
          ) : (
            summary.badges.map(group => {
              const zone = isEventZoneId(group.zoneId) ? EVENT_ZONE_BY_ID[group.zoneId] : undefined;
              const zoneLabel = zone ? eventZoneName(zone, language) : copy.unknownZone;
              return (
                <View
                  key={group.zoneId}
                  className="gap-2 rounded-2xl border bg-white px-3.5 py-3"
                  style={{ borderColor: BRAND_BORDER }}>
                  <Text className="text-[12px] font-bold" style={{ color: BRAND_MUTED }}>
                    {zoneLabel}
                  </Text>
                  <View className="flex-row flex-wrap items-center gap-2">
                    {group.items.map(badge =>
                      badge.imageUrl ? (
                        <View key={`${group.zoneId}:${badge.code}`} className="items-center gap-1">
                          <Image
                            source={{ uri: badge.imageUrl }}
                            style={{ width: 40, height: 40, borderRadius: 20 }}
                          />
                          <Text
                            className="max-w-[72px] text-center text-[10px] font-bold"
                            numberOfLines={1}
                            style={{ color: BRAND_TEXT }}>
                            {badge.name}
                          </Text>
                        </View>
                      ) : (
                        <EventChip
                          key={`${group.zoneId}:${badge.code}`}
                          label={badge.name}
                          variant="neutral"
                        />
                      ),
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <Text className="px-0.5 text-[13px] font-bold" style={{ color: BRAND_TEXT }}>
          {copy.ledgerTitle}
        </Text>
      </View>
    ),
    [copy, language, summary],
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingTop: insets.top }}>
      <View className="border-b border-[#E2E8F0] bg-white px-2">
        <EventNavHeader
          title={copy.screenTitle}
          subtitle={copy.subtitle}
          onBack={goBack}
          backAccessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
        />
      </View>

      {!isAuthenticated ? (
        <View className="px-4 pt-4">
          <Pressable
            accessibilityRole="button"
            onPress={goLogin}
            className="rounded-2xl border bg-white px-4 py-3 active:opacity-80"
            style={{ borderColor: BRAND_BORDER }}>
            <Text className="text-[13px] leading-5" style={{ color: BRAND_MUTED }}>
              {copy.loginRequired}
            </Text>
            <Text className="mt-1 text-[13px] font-bold" style={{ color: BRAND_PRIMARY }}>
              {copy.loginAction}
            </Text>
          </Pressable>
        </View>
      ) : loading && ledger.length === 0 && summary.badges.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={ledger}
          keyExtractor={item => item.ledgerId}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <LedgerRow
              item={item}
              copy={copy}
              timestamp={formatParticipationTimestamp(item.createdAt, language)}
            />
          )}
          ListEmptyComponent={
            <Text className="px-0.5 pb-4 text-[13px] leading-5" style={{ color: BRAND_MUTED }}>
              {copy.ledgerEmpty}
            </Text>
          }
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
