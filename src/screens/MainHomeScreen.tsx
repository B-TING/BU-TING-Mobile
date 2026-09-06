import { ScrollView, View } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';

import { TransientBottomToast } from '../components/shared/feedback/TransientBottomToast';
import { ActivePlanHeroBanner } from '../components/home/banners/ActivePlanHeroBanner';
import { HeroBanner } from '../components/home/banners/HeroBanner';
import { HomePlanPickerModal } from '../components/home/modals/HomePlanPickerModal';
import { EventsSectionMock } from '../components/home/sections/EventsSectionMock';
import { HomeEventZoneSection } from '../components/home/sections/HomeEventZoneSection';
import { QuickAccessRow } from '../components/home/sections/QuickAccessRow';
import { TraveloguePreview } from '../components/home/sections/TraveloguePreview';
import { HomeActionFabs } from '../components/helpdesk/HomeActionFabs';
import { QUICK_ACCESS_ITEMS } from '../constants/home/mainHome';
import { layout } from '../constants/common/layout';
import { TEST_ID } from '../constants/e2e/testIds';
import { useMainHomeScreen } from '../hooks/home/useMainHomeScreen';
import { openItineraryOrWizard } from '../navigation/navigateToMainTab';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NavigationProp<RootStackParamList>;
  /** 온보딩 가이드 등 Navbar 미표시 시 하단 clearance 제거 */
  suppressNavbarClearance?: boolean;
  /** 온보딩 가이드에서 리부트 FAB을 임시로 표시 */
  forceShowRebootFab?: boolean;
  /** 온보딩 가이드: 해당 타깃이 보이도록 홈 스크롤 */
  guideScrollTargetId?: string | null;
};

export function MainHomeScreen({
  navigation,
  suppressNavbarClearance = false,
  forceShowRebootFab = false,
  guideScrollTargetId = null,
}: Props) {
  const {
    scrollRef,
    language,
    copy,
    helpCopy,
    featuredPlan,
    featuredTravelStatus,
    pickerPlans,
    activePlanCount,
    canSwitchPlans,
    planPickerOpen,
    showTripRebootFab,
    toastText,
    toastOpacity,
    latestTravelogue,
    loadingTravelogue,
    homeEvents,
    upcomingStop,
    fabBottom,
    scrollPaddingBottom,
    activePlanHeroCopy,
    goToPlan,
    openPlanPicker,
    closePlanPicker,
    selectHomePlan,
    goToCreatePlan,
    goToReboot,
    goToHelpDesk,
    goToEventZone,
    goToEventZoneChat,
    handleQuickAccessPress,
    handleEventsViewAllPress,
    handleEventPress,
    handleTravelogueLayout,
    handleTraveloguePress,
    handleFeedPress,
  } = useMainHomeScreen({
    navigation,
    suppressNavbarClearance,
    forceShowRebootFab,
    guideScrollTargetId,
  });

  return (
    <View testID={TEST_ID.home.screen} className="flex-1 bg-brand-background" style={layout.screen}>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
        showsVerticalScrollIndicator={false}>
        {featuredPlan && featuredTravelStatus ? (
          <ActivePlanHeroBanner
            plan={featuredPlan}
            travelStatus={featuredTravelStatus}
            upcoming={upcomingStop}
            language={language}
            copy={activePlanHeroCopy}
            canSwitchPlans={canSwitchPlans}
            planCount={activePlanCount}
            onPress={goToPlan}
            onSwitchPress={openPlanPicker}
            onCreatePress={goToCreatePlan}
          />
        ) : (
          <HeroBanner
            title={copy.heroTitle}
            subtitle={copy.heroSubtitle}
            ctaLabel={copy.heroCta}
            onCtaPress={() => openItineraryOrWizard(navigation)}
          />
        )}

        <View className="px-5">
          <QuickAccessRow
            items={QUICK_ACCESS_ITEMS}
            language={language}
            onItemPress={handleQuickAccessPress}
          />

          <HomeEventZoneSection
            onMapPress={goToEventZone}
            onEnterChat={goToEventZoneChat}
          />

          <EventsSectionMock
            title={copy.eventsTitle}
            viewAllLabel={copy.eventsViewAll}
            events={homeEvents}
            language={language}
            onViewAllPress={handleEventsViewAllPress}
            onEventPress={handleEventPress}
          />

          <View
            onLayout={e => {
              handleTravelogueLayout(e.nativeEvent.layout.y);
            }}>
            <TraveloguePreview
              trendingTitle={copy.trendingTitle}
              language={language}
              latestTravelogue={latestTravelogue}
              loading={loadingTravelogue}
              onTraveloguePress={handleTraveloguePress}
              onFeedPress={handleFeedPress}
            />
          </View>
        </View>
      </ScrollView>

      <HomeActionFabs
        bottom={fabBottom}
        helpLabel={helpCopy.fabLabel}
        showReboot={showTripRebootFab}
        onHelpPress={goToHelpDesk}
        onRebootPress={goToReboot}
      />

      <TransientBottomToast
        text={toastText}
        opacity={toastOpacity}
        bottom={fabBottom}
      />

      <HomePlanPickerModal
        visible={planPickerOpen}
        plans={pickerPlans}
        selectedPlanId={featuredPlan?.planId ?? null}
        language={language}
        copy={copy}
        onClose={closePlanPicker}
        onSelect={selectHomePlan}
        onCreatePress={goToCreatePlan}
      />
    </View>
  );
}
