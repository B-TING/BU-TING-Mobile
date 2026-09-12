import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { calcTripDday } from '../../../constants/home/mainHome';
import { ICON_COLOR_WHITE } from '../../../constants/icons';
import { dayCountBetween } from '../../../constants/plan/planWizard';
import type { TravelStatusDto } from '../../../types/travelApi';
import type { TravelPlan } from '../../../types/travelPlan';
import type { AppLanguage } from '../../../types/user';
import { formatWeekdayDate } from '../../../utils/geo/geo';
import type { UpcomingStop } from '../../../utils/plan/planSchedule';
import { cn } from '../../../utils/common/cn';
import { GUIDE_TARGET } from '../../guide/guideTypes';
import { GuideTarget } from '../../guide/GuideTarget';
import { AppIcon } from '../../shared/icons/AppIcon';

const heroImage = require('../../../../assets/images/home-hero.jpg');

type ActivePlanHeroBannerProps = {
  plan: TravelPlan;
  travelStatus: TravelStatusDto;
  upcoming: UpcomingStop | null;
  language: AppLanguage;
  copy: {
    plannedLabel: string;
    inProgressLabel: string;
    completedLabel: string;
    nextStop: string;
    viewItinerary: string;
    viewCompletedItinerary: string;
    completedTripHint: string;
    dday: (n: number) => string;
    ddayToday: string;
    dayLabel: (n: number) => string;
    switchPlanCount: (n: number) => string;
    switchPlanA11y: string;
    createNewPlan: string;
    createNewPlanChip: string;
    createNewPlanA11y: string;
  };
  canSwitchPlans?: boolean;
  planCount?: number;
  onPress: () => void;
  onSwitchPress?: () => void;
  onCreatePress?: () => void;
};

const STATUS_BADGE_CLASS: Record<TravelStatusDto, string> = {
  PLANNED: 'bg-sky-500',
  IN_PROGRESS: 'bg-brand-primary',
  COMPLETED: 'bg-slate-500',
};

const STATUS_OVERLAY_CLASS: Record<TravelStatusDto, string> = {
  PLANNED: 'rgba(15, 23, 42, 0.42)',
  IN_PROGRESS: 'rgba(15, 23, 42, 0.45)',
  COMPLETED: 'rgba(15, 23, 42, 0.58)',
};

const DAY_KO = '\uC77C';
const ARROW = '\u2192';
const DOT = '\u00B7';
const EMDASH = '\u2014';

function statusLabel(
  travelStatus: TravelStatusDto,
  copy: ActivePlanHeroBannerProps['copy'],
): string {
  if (travelStatus === 'PLANNED') {
    return copy.plannedLabel;
  }
  if (travelStatus === 'COMPLETED') {
    return copy.completedLabel;
  }
  return copy.inProgressLabel;
}

function ddayText(
  startDate: string,
  copy: ActivePlanHeroBannerProps['copy'],
): string {
  const d = calcTripDday(startDate);
  if (d > 0) {
    return copy.dday(d);
  }
  if (d === 0) {
    return copy.ddayToday;
  }
  return `D+${Math.abs(d)}`;
}

function metaLine(
  plan: TravelPlan,
  travelStatus: TravelStatusDto,
  language: AppLanguage,
  copy: ActivePlanHeroBannerProps['copy'],
): string {
  const dayCount = dayCountBetween(plan.startDate, plan.endDate);
  const daySuffix = language === 'ko' ? DAY_KO : ' days';
  const period = `${plan.startDate} ${ARROW} ${plan.endDate} ${DOT} ${dayCount}${daySuffix}`;

  if (travelStatus === 'PLANNED') {
    return `${period} ${DOT} ${ddayText(plan.startDate, copy)}`;
  }
  if (travelStatus === 'COMPLETED') {
    return `${period} ${DOT} ${copy.completedTripHint}`;
  }
  return `${period} ${DOT} ${ddayText(plan.startDate, copy)}`;
}

export function ActivePlanHeroBanner({
  plan,
  travelStatus,
  upcoming,
  language,
  copy,
  canSwitchPlans = false,
  planCount = 1,
  onPress,
  onSwitchPress,
  onCreatePress,
}: ActivePlanHeroBannerProps) {
  const showNextStop = travelStatus === 'IN_PROGRESS' && upcoming != null;
  const ctaLabel =
    travelStatus === 'COMPLETED'
      ? copy.viewCompletedItinerary
      : copy.viewItinerary;
  const showHeaderActions =
    Boolean(onCreatePress) || (canSwitchPlans && onSwitchPress);

  return (
    <GuideTarget id={GUIDE_TARGET.plannerHeroCta} className="mb-5">
      <View>
        <Pressable
          onPress={onPress}
          className="overflow-hidden active:opacity-95"
          accessibilityRole="button">
          <ImageBackground
            source={heroImage}
            style={styles.image}
            resizeMode="cover">
            <View
              style={[
                styles.overlay,
                { backgroundColor: STATUS_OVERLAY_CLASS[travelStatus] },
              ]}
              className="justify-end p-5">
              <View
                className={cn(
                  'mb-2 self-start rounded-full px-2.5 py-1',
                  STATUS_BADGE_CLASS[travelStatus],
                )}>
                <Text className="text-[11px] font-bold text-white">
                  {statusLabel(travelStatus, copy)}
                </Text>
              </View>
              <Text
                className={cn(
                  'mb-1 text-lg font-bold leading-snug text-white',
                  showHeaderActions && 'pr-28',
                )}
                numberOfLines={2}>
                {plan.title}
              </Text>
              <Text className="mb-3 text-xs text-white/90">
                {metaLine(plan, travelStatus, language, copy)}
              </Text>
              {showNextStop ? (
                <View className="rounded-xl bg-white/15 px-3 py-2.5">
                  <Text className="mb-0.5 text-[11px] font-semibold text-white/80">
                    {copy.nextStop}
                  </Text>
                  <Text
                    className="text-sm font-bold text-white"
                    numberOfLines={1}>
                    {copy.dayLabel(upcoming.day.dayNumber)} {DOT}{' '}
                    {formatWeekdayDate(upcoming.day.date, language)} {EMDASH}{' '}
                    {upcoming.route.placeName}
                  </Text>
                </View>
              ) : null}
              <Text
                className={cn(
                  'mt-3 text-sm font-bold',
                  travelStatus === 'COMPLETED'
                    ? 'text-white/85'
                    : 'text-brand-secondary',
                )}>
                {ctaLabel} {ARROW}
              </Text>
            </View>
          </ImageBackground>
        </Pressable>
        {showHeaderActions ? (
          <View className="absolute right-4 top-4 flex-row items-center">
            {canSwitchPlans && onSwitchPress ? (
              <Pressable
                onPress={onSwitchPress}
                hitSlop={8}
                className="mr-1.5 flex-row items-center rounded-full bg-white/20 px-2.5 py-1 active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel={copy.switchPlanA11y}>
                <Text className="mr-0.5 text-[11px] font-bold text-white">
                  {copy.switchPlanCount(planCount)}
                </Text>
                <AppIcon
                  name="chevronDown"
                  size={14}
                  color={ICON_COLOR_WHITE}
                  strokeWidth={2.5}
                />
              </Pressable>
            ) : null}
            {onCreatePress ? (
              <Pressable
                onPress={onCreatePress}
                hitSlop={8}
                className="flex-row items-center rounded-full bg-white/20 px-2.5 py-1 active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel={copy.createNewPlanA11y}>
                <AppIcon
                  name="plus"
                  size={14}
                  color={ICON_COLOR_WHITE}
                  strokeWidth={2.5}
                />
                <Text className="ml-0.5 text-[11px] font-bold text-white">
                  {copy.createNewPlanChip}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </GuideTarget>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    minHeight: 240,
  },
  overlay: {
    flex: 1,
    minHeight: 240,
  },
});
