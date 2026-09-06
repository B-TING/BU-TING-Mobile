import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FestivalCard } from '../../components/festival/FestivalCard';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { TEST_ID } from '../../constants/e2e/testIds';
import { ICON_COLOR_MUTED, ICON_COLOR_PRIMARY } from '../../constants/icons';
import {
  festivalsInMonth,
  parseIsoDate,
  todayIso,
} from '../../constants/festival/festivalCalendar';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import { useFestivalStore } from '../../stores';
import { monthDateRangeYyyymmdd, monthKey } from '../../utils/places/festivalApiMapper';

type Props = NativeStackScreenProps<RootStackParamList, 'FestivalCalendar'>;

export function FestivalCalendarScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('festivalCalendar');

  const initialDate = route.params?.initialDate ?? todayIso();
  const initialParsed = parseIsoDate(initialDate);

  const [year, setYear] = useState(initialParsed.getFullYear());
  const [month, setMonth] = useState(initialParsed.getMonth());

  const fetchFestivalsForMonth = useFestivalStore(s => s.fetchFestivalsForMonth);
  const monthCache = useFestivalStore(s => s.cacheByMonth[monthKey(year, month)]);
  const isLoading = useFestivalStore(s => s.loadingByMonth[monthKey(year, month)] ?? false);
  const monthError = monthCache?.error ?? null;
  const monthFestivals = useMemo(
    () => (monthCache ? festivalsInMonth(monthCache.festivals, year, month) : []),
    [monthCache, year, month],
  );

  useEffect(() => {
    void fetchFestivalsForMonth(
      year,
      month,
      language === 'ko' ? '축제 정보를 불러오지 못했어요' : 'Could not load festivals',
    );
  }, [year, month, fetchFestivalsForMonth, language]);

  const goPrevMonth = () => {
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else {
      setMonth(m => m - 1);
    }
  };

  const goNextMonth = () => {
    if (month === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else {
      setMonth(m => m + 1);
    }
  };

  const emptyMessage = useMemo(() => {
    if (monthError) {
      return monthError;
    }
    return copy.emptyMonthList;
  }, [monthError, copy.emptyMonthList]);

  return (
    <View
      testID={TEST_ID.festival.screen}
      className="flex-1 bg-brand-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text">{copy.screenTitle}</Text>
      </View>

      <View className="flex-row items-center justify-between border-b border-brand-border bg-brand-surface px-4 py-3">
        <Pressable
          onPress={goPrevMonth}
          testID={TEST_ID.festival.prevMonth}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-brand-selected"
          accessibilityRole="button"
          accessibilityLabel={copy.prevMonth}>
          <AppIcon name="chevronLeft" size={24} color={ICON_COLOR_PRIMARY} />
        </Pressable>
        <View className="items-center">
          <Text className="text-base font-bold text-brand-text">
            {copy.monthFestivalsLabel(year, month)}
          </Text>
          {monthFestivals.length > 0 ? (
            <Text className="mt-0.5 text-xs text-brand-muted">
              {copy.festivalCount(monthFestivals.length)}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={goNextMonth}
          testID={TEST_ID.festival.nextMonth}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-brand-selected"
          accessibilityRole="button"
          accessibilityLabel={copy.nextMonth}>
          <AppIcon name="chevronRight" size={24} color={ICON_COLOR_PRIMARY} />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}>
          {monthFestivals.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-brand-border bg-brand-surface px-6 py-12">
              <AppIcon name="tent" size={40} color={ICON_COLOR_MUTED} />
              <Text className="mt-3 text-sm font-semibold text-brand-text">{emptyMessage}</Text>
              {!monthError ? (
                <Text className="mt-1 text-xs text-brand-muted">{copy.emptyMonthListSub}</Text>
              ) : null}
            </View>
          ) : (
            monthFestivals.map(festival => (
              <FestivalCard
                key={festival.id}
                festival={festival}
                language={language}
                onPress={() => {
                  const { eventStartDate, eventEndDate } = monthDateRangeYyyymmdd(year, month);
                  navigation.navigate('PlaceMapSearch', {
                    contentTypeId: PLACE_CONTENT_TYPE.festival,
                    selectedContentId: festival.id,
                    festivalEventStartDate: eventStartDate,
                    festivalEventEndDate: eventEndDate,
                  });
                }}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
