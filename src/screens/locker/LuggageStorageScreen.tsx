import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LockerLineFilterBar } from '../../components/locker/LockerLineFilterBar';
import { LockerMapView } from '../../components/locker/LockerMapView';
import { SubwayLockerDetailSheet } from '../../components/locker/SubwayLockerDetailSheet';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { TEST_ID } from '../../constants/e2e/testIds';
import { useAppLanguage } from '../../i18n';
import { ICON_COLOR_MUTED, ICON_COLOR_PRIMARY } from '../../constants/icons';
import {
  getSubwayLineColor,
  getSubwayLineTint,
} from '../../constants/locker/subwayLineColors';
import { useLuggageStorageScreen } from '../../hooks/locker/useLuggageStorageScreen';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'LuggageStorage'>;

export function LuggageStorageScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const {
    copy,
    loading,
    stations,
    filteredStations,
    selectedStation,
    detailOpen,
    lineFilter,
    availableLines,
    totalLockers,
    bookmarkedStationIds,
    isBookmarked,
    formatDistanceMeters,
    handleLineFilterChange,
    handleSelectStation,
    handleCloseDetail,
    handleToggleBookmark,
  } = useLuggageStorageScreen();

  return (
    <View
      testID={TEST_ID.luggage.screen}
      className="flex-1 bg-brand-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text" numberOfLines={1}>
          {copy.screenTitle}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0077B6" />
          <Text className="mt-3 text-sm text-brand-muted">{copy.loading}</Text>
        </View>
      ) : stations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base font-semibold text-brand-text">{copy.empty}</Text>
          <Text className="mt-2 text-center text-sm text-brand-muted">{copy.emptySub}</Text>
        </View>
      ) : (
        <View className="min-h-0 flex-1">
          <View className="border-b border-brand-border bg-brand-surface px-4 py-2">
            <Text className="text-sm font-semibold text-brand-text">
              {copy.summary(filteredStations.length, totalLockers)}
            </Text>
            <Text className="mt-0.5 text-[11px] text-brand-muted">{copy.dataHint}</Text>
          </View>

          <View className="min-h-0 flex-1">
            <LockerMapView
              stations={filteredStations}
              selectedId={selectedStation?.id}
              bookmarkedIds={bookmarkedStationIds}
              onSelectStation={handleSelectStation}
              mapTitle={copy.mapTitle}
              mapSubtitle={copy.mapSubtitle}
              pinA11y={copy.pinA11y}
              bookmarkedPinA11y={copy.bookmarkedPinA11y}
              lineLabel={copy.lineLabel}
            />
          </View>

          {!detailOpen ? (
            <View className="border-t border-brand-border bg-brand-surface">
              <LockerLineFilterBar
                lines={availableLines.lines}
                hasUnknown={availableLines.hasUnknown}
                value={lineFilter}
                onChange={handleLineFilterChange}
                allLabel={copy.lineFilterAll}
                unknownLabel={copy.lineUnknown}
                lineLabel={copy.lineLabel}
              />
              <Text className="px-4 pt-2 text-xs text-brand-muted">{copy.selectStationHint}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
                {filteredStations.map(station => {
                  const bookmarked = isBookmarked(station.id);
                  const selected = selectedStation?.id === station.id;
                  const lineColor = getSubwayLineColor(station.line);
                  const lineTint = getSubwayLineTint(station.line);

                  return (
                    <Pressable
                      key={station.id}
                      onPress={() => handleSelectStation(station)}
                      className={`rounded-2xl border px-4 py-3 active:opacity-80 ${
                        selected
                          ? 'border-brand-primary bg-brand-selected'
                          : bookmarked
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-brand-border bg-brand-background'
                      }`}>
                      <View className="flex-row items-center gap-1">
                        {bookmarked ? (
                          <AppIcon name="mapPin" size={12} color={ICON_COLOR_PRIMARY} filled />
                        ) : null}
                        <Text className="text-sm font-bold text-brand-text">{station.name}</Text>
                      </View>
                      <View className="mt-1 flex-row items-center gap-1.5">
                        <View
                          className="rounded-full px-2 py-0.5"
                          style={{ backgroundColor: lineTint }}>
                          <Text className="text-[10px] font-bold" style={{ color: lineColor }}>
                            {copy.lineLabel(station.line)}
                          </Text>
                        </View>
                        <AppIcon name="luggage" size={12} color={ICON_COLOR_MUTED} />
                        <Text className="text-xs text-brand-muted">
                          {station.lockers.total}
                          {station.distanceMeters != null
                            ? ` · ${formatDistanceMeters(station.distanceMeters)}`
                            : ''}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      )}

      <SubwayLockerDetailSheet
        visible={detailOpen}
        station={selectedStation}
        copy={copy}
        bookmarked={selectedStation ? isBookmarked(selectedStation.id) : false}
        onToggleBookmark={handleToggleBookmark}
        onClose={handleCloseDetail}
      />
    </View>
  );
}
