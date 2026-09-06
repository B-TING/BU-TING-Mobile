import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventChip } from '../../components/eventZone/EventChip';
import { EventNavHeader } from '../../components/eventZone/EventNavHeader';
import { EventTitleRow } from '../../components/eventZone/EventTitleRow';
import {
  BRAND_BORDER,
  BRAND_MUTED,
  BRAND_PRIMARY,
  BRAND_TEXT,
} from '../../components/eventZone/eventZoneTheme';
import { EVENT_ZONE_BY_ID, eventZoneName } from '../../constants/eventZone/eventZone';
import { useEventTitlesScreen } from '../../hooks/eventZone/useEventTitlesScreen';
import { useAppLanguage } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EventTitles'>;

function authorInitial(nickname: string): string {
  const trimmed = nickname.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

export function EventTitlesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const {
    copy,
    nickname,
    isAuthenticated,
    loading,
    refreshing,
    busyTitleId,
    sections,
    equipped,
    cityGrade,
    highlightZoneId,
    highlightSuccess,
    refresh,
    handlePressRow,
    goBack,
    goLogin,
  } = useEventTitlesScreen(navigation);

  const highlightZone = highlightZoneId ? EVENT_ZONE_BY_ID[highlightZoneId] : undefined;
  const highlightZoneLabel = highlightZone
    ? eventZoneName(highlightZone, language)
    : highlightZoneId ?? '';

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

      {loading && sections.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
            gap: 16,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
          }
          showsVerticalScrollIndicator={false}>
          <View
            className="flex-row items-center gap-3 rounded-2xl border bg-white px-3.5 py-3.5"
            style={{ borderColor: BRAND_BORDER }}>
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: BRAND_PRIMARY }}>
              <Text className="text-base font-bold text-white">{authorInitial(nickname)}</Text>
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row flex-wrap items-center gap-1.5">
                <Text className="text-[15px] font-bold" style={{ color: BRAND_TEXT }}>
                  {nickname}
                </Text>
                {equipped ? <EventChip label={equipped.titleName} variant="title" /> : null}
              </View>
              {cityGrade?.gradeName ? (
                <Text className="mt-0.5 text-[12px] font-medium" style={{ color: BRAND_MUTED }}>
                  {copy.cityGrade(cityGrade.gradeName)}
                </Text>
              ) : null}
              <Text className="mt-0.5 text-[12px] font-medium" style={{ color: BRAND_MUTED }}>
                {equipped || highlightZoneLabel
                  ? copy.zoneSuccess(highlightZoneLabel, highlightSuccess)
                  : copy.noEquipped}
              </Text>
            </View>
          </View>

          {!isAuthenticated ? (
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
          ) : null}

          {sections.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8 py-16">
              <Text className="text-center text-sm leading-relaxed" style={{ color: BRAND_MUTED }}>
                {copy.empty}
              </Text>
            </View>
          ) : (
            sections.map(section => {
              const zone = EVENT_ZONE_BY_ID[section.zoneId];
              const zoneLabel = zone ? eventZoneName(zone, language) : section.zoneId;
              return (
                <View key={section.zoneId} className="gap-2">
                  <View className="px-0.5">
                    <Text className="text-[13px] font-bold" style={{ color: BRAND_TEXT }}>
                      {copy.zoneTier(zoneLabel)}
                    </Text>
                    {section.remainingToNext != null && section.remainingToNext > 0 ? (
                      <Text className="text-[11px] font-medium" style={{ color: BRAND_MUTED }}>
                        {copy.remainingToNext(section.remainingToNext)}
                      </Text>
                    ) : null}
                  </View>
                  {section.rows.map(row => (
                    <EventTitleRow
                      key={row.key}
                      name={row.titleName}
                      subtitle={copy.requiredSuccess(row.requiredSuccessCount)}
                      status={row.status}
                      actionLabel={
                        row.status === 'equipped'
                          ? copy.equipped
                          : row.status === 'owned'
                            ? copy.equip
                            : copy.locked
                      }
                      busy={busyTitleId === row.key}
                      onPress={
                        row.status === 'locked' ? undefined : () => void handlePressRow(row)
                      }
                    />
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
