import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PlanSyncStatusDot } from '../../components/plan/PlanSyncStatusDot';
import { TransientBottomToast } from '../../components/shared/feedback/TransientBottomToast';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { BudgetEntryModal } from '../../components/plan/modals/BudgetEntryModal';
import { PlacePickModal } from '../../components/plan/modals/PlacePickModal';
import { TravelInviteLinkModal } from '../../components/plan/modals/TravelInviteLinkModal';
import { MemberActionsModal } from '../../components/plan/modals/MemberActionsModal';
import { HomePlanPickerModal } from '../../components/home/modals/HomePlanPickerModal';
import { PlanBudgetTab } from '../../components/plan/tabs/PlanBudgetTab';
import { PlanOverviewTab } from '../../components/plan/tabs/PlanOverviewTab';
import { PlanRecordsTab } from '../../components/plan/tabs/PlanRecordsTab';
import { PlanScheduleTab } from '../../components/plan/tabs/PlanScheduleTab';
import { PlanTabPager } from '../../components/plan/tabs/PlanTabPager';
import { PlaceReviewFormModal } from '../../components/review/modals/PlaceReviewFormModal';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { useAppBarTopInset } from '../../components/shared/navigation/AppBar';
import { ICON_COLOR_DEFAULT, ICON_COLOR_PRIMARY } from '../../constants/icons';
import { TEST_ID } from '../../constants/e2e/testIds';
import { canRemovePlanDay } from '../../services/travel/planDaySync';
import { usePlanDetailScreen } from '../../hooks/plan/usePlanDetailScreen';
import { useMainTabNavigationOptional } from '../../navigation/mainTabNavigation';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanDetail'> & {
  embeddedInMainTabs?: boolean;
};

export function PlanDetailScreen({ navigation, route, embeddedInMainTabs = false }: Props) {
  const headerTopInset = useAppBarTopInset();
  const mainTabNav = useMainTabNavigationOptional();
  const isRouteMainTabActive = !embeddedInMainTabs || mainTabNav?.activeTab === 'route';
  const {
    language,
    offlineMode,
    plansHydrated,
    copy,
    pickerCopy,
    setupCopy,
    reviewCopy,
    enrichedPlan,
    planId,
    isApiPlan,
    isPlanOfflineSync,
    viewOnly,
    scheduleReadOnly,
    tab,
    setTab,
    toastText,
    toastOpacity,
    showToast,
    notifyScheduleReadOnly,
    selectedDay,
    setSelectedDay,
    scheduleReorderActive,
    setScheduleReorderActive,
    reviewFormRoute,
    setReviewFormRoute,
    savingReview,
    budgetModalOpen,
    setBudgetModalOpen,
    inviteModalOpen,
    inviteLink,
    inviteExpiredAt,
    inviteLoading,
    inviteError,
    canInvite,
    canLeaveTrip,
    leavingTrip,
    selectedMember,
    memberActionBusy,
    memberActionError,
    canTransferSelected,
    canKickSelected,
    settlementConfirmed,
    canConfirmSettlement,
    settlementMemberSummaries,
    settlementForDisplay,
    settlementLoading,
    settlementError,
    confirming,
    budgetEntries,
    budgetTotal,
    tripDates,
    allRoutes,
    recordsProgress,
    isPlanPublished,
    roleLabels,
    day,
    transportCopy,
    mainTabBottomClearance,
    actionBarBottomInset,
    toastBottom,
    scheduleRef,
    planReviews,
    displayName,
    scheduleModal,
    pickRoute,
    schedulePlaceIds,
    addPlaceAnchor,
    reviewFormExisting,
    handleBackPress,
    handleInvite,
    openMemberActions,
    closeMemberActions,
    requestTransferLeader,
    requestKickMember,
    requestLeaveTrip,
    handleSaveBudgetEntry,
    handleConfirmSettlement,
    closeInviteModal,
    loadInviteLink,
    handleDeleteRoute,
    handleAddDay,
    handleRemoveDay,
    handleToggleVisited,
    handleSaveRouteMemo,
    handlePickReplacement,
    handleReorderRoutes,
    handleOptimizeDayRoute,
    handleAddPlace,
    handleQuickRating,
    handleSavePlaceReview,
    handleDeletePlaceReview,
    closeScheduleModal,
    requestCompletePlan,
    syncExpenses,
    handlePublished,
    handleViewFeed,
    handleViewTravelRecord,
    handleWriteReview,
    handleScheduleModalChange,
    pickerPlans,
    canSwitchPlans,
    planPickerOpen,
    openPlanPicker,
    closePlanPicker,
    selectPlan,
    createNewPlan,
  } = usePlanDetailScreen({
    navigation,
    paramPlanId: route.params?.planId,
    initialTab: route.params?.tab,
    openReboot: route.params?.openReboot,
    embeddedInMainTabs,
  });

  const scheduleImmersive =
    embeddedInMainTabs && isRouteMainTabActive && tab === 'schedule';

  useEffect(() => {
    if (!embeddedInMainTabs || !mainTabNav) {
      return;
    }
    mainTabNav.setNavbarHidden(scheduleImmersive);
    return () => {
      mainTabNav.setNavbarHidden(false);
    };
  }, [embeddedInMainTabs, mainTabNav, scheduleImmersive]);

  if (!enrichedPlan) {
    if (offlineMode && !plansHydrated) {
      return (
        <View className="flex-1 items-center justify-center bg-brand-background">
          <ActivityIndicator size="large" color="#0077B6" />
        </View>
      );
    }
    return null;
  }

  return (
    <View testID={TEST_ID.planDetail.screen} className="flex-1 bg-brand-background">
      <View
        className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 pb-3"
        style={{
          // 메인 탭은 AppBar가 safe area를 담당. 스택(오프라인 등)은 헤더에 inset 필요.
          paddingTop: embeddedInMainTabs ? 12 : headerTopInset,
        }}>
        {!embeddedInMainTabs ? (
          <BackButton
            accessibilityLabel={
              offlineMode
                ? language === 'ko'
                  ? '로그인으로'
                  : 'Back to login'
                : language === 'ko'
                  ? '메인으로'
                  : 'Back to home'
            }
            onPress={handleBackPress}
          />
        ) : null}
        {canSwitchPlans ? (
          <Pressable
            onPress={openPlanPicker}
            className="min-w-0 flex-1 flex-row items-center active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={pickerCopy.switchPlanA11y}>
            <Text
              className="mr-1 flex-1 text-lg font-bold text-brand-text"
              numberOfLines={1}>
              {enrichedPlan.title}
            </Text>
            <AppIcon name="chevronDown" size={18} color={ICON_COLOR_DEFAULT} />
          </Pressable>
        ) : (
          <Text className="flex-1 text-lg font-bold text-brand-text" numberOfLines={1}>
            {enrichedPlan.title}
          </Text>
        )}
        {!offlineMode ? (
          <Pressable
            onPress={createNewPlan}
            hitSlop={8}
            className="ml-2 h-9 w-9 items-center justify-center rounded-full active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={pickerCopy.createNewPlanA11y}>
            <AppIcon name="plus" size={20} color={ICON_COLOR_PRIMARY} strokeWidth={2.5} />
          </Pressable>
        ) : null}
        {isApiPlan && !offlineMode ? (
          <PlanSyncStatusDot offline={isPlanOfflineSync} />
        ) : null}
      </View>

      {offlineMode ? (
        <View className="border-b border-brand-border bg-brand-selected px-4 py-2">
          <Text className="text-center text-xs font-semibold text-brand-primary">
            {language === 'ko'
              ? '오프라인 모드 · 열람만 가능'
              : 'Offline mode · view only'}
          </Text>
        </View>
      ) : null}

      <View className="min-h-0 flex-1">
        <PlanTabPager
          active={tab}
          onChange={setTab}
          language={language}
          scrollBottomInset={mainTabBottomClearance}
          horizontalScrollEnabled={
            !scheduleReorderActive && tab !== 'schedule' && tab !== 'overview'
          }
          pages={{
            overview: (
              <PlanOverviewTab
                plan={enrichedPlan}
                language={language}
                copy={copy}
                roleLabels={roleLabels}
                budgetEntries={budgetEntries}
                budgetTotal={budgetTotal}
                onNavigateToTab={setTab}
                recordsProgress={recordsProgress}
                isTravelRecordPublished={isPlanPublished}
                showInvite={isApiPlan && canInvite && !offlineMode}
                onInvite={handleInvite}
                showLeave={canLeaveTrip}
                leaveDisabled={leavingTrip}
                onLeave={requestLeaveTrip}
                onSelectMember={canInvite ? openMemberActions : undefined}
              />
            ),
            schedule: (
              <PlanScheduleTab
                ref={scheduleRef}
                isActive={tab === 'schedule' && isRouteMainTabActive}
                planId={planId}
                plan={enrichedPlan}
                language={language}
                copy={copy}
                readOnly={viewOnly}
                onReadOnlyPress={scheduleReadOnly ? notifyScheduleReadOnly : undefined}
                selectedDay={selectedDay}
                planReviews={planReviews}
                onSelectDay={setSelectedDay}
                onToggleVisited={handleToggleVisited}
                onWriteReview={handleWriteReview}
                onQuickRating={handleQuickRating}
                onDeleteRoute={handleDeleteRoute}
                onSaveRouteMemo={viewOnly ? undefined : handleSaveRouteMemo}
                onReorderRoutes={
                  viewOnly ? undefined : isApiPlan ? handleReorderRoutes : undefined
                }
                onOptimizeDayRoute={
                  viewOnly ? undefined : isApiPlan ? handleOptimizeDayRoute : undefined
                }
                onScheduleModalChange={handleScheduleModalChange}
                onReorderActiveChange={setScheduleReorderActive}
                canAddDay={!viewOnly}
                canRemoveDay={canRemovePlanDay(enrichedPlan)}
                onAddDay={() => {
                  void handleAddDay();
                }}
                onRemoveDay={handleRemoveDay}
                actionBarBottomInset={actionBarBottomInset}
                onNotify={showToast}
              />
            ),
            budget: (
              <PlanBudgetTab
                copy={copy}
                language={language}
                tripDates={tripDates}
                budgetEntries={budgetEntries}
                budgetTotal={budgetTotal}
                members={enrichedPlan.members}
                onAddExpense={
                  viewOnly || settlementConfirmed
                    ? undefined
                    : () => setBudgetModalOpen(true)
                }
                showSettlement={isApiPlan && !offlineMode}
                settlement={settlementForDisplay}
                memberSummaries={settlementMemberSummaries}
                settlementLoading={settlementLoading}
                settlementError={settlementError}
                canConfirmSettlement={canConfirmSettlement}
                confirmingSettlement={confirming}
                onConfirmSettlement={handleConfirmSettlement}
                onRetrySettlement={() => {
                  void syncExpenses();
                }}
              />
            ),
            records: (
              <PlanRecordsTab
                plan={enrichedPlan}
                allRoutes={allRoutes}
                language={language}
                authorNickname={displayName}
                destinationLabel={enrichedPlan.title}
                isTripActive={!offlineMode && enrichedPlan.status !== 'COMPLETED'}
                onPublished={offlineMode ? undefined : handlePublished}
                onEndTrip={offlineMode ? undefined : requestCompletePlan}
                onViewFeed={offlineMode ? undefined : handleViewFeed}
                onViewTravelRecord={offlineMode ? undefined : handleViewTravelRecord}
              />
            ),
          }}
        />
      </View>

      <BudgetEntryModal
        visible={!viewOnly && budgetModalOpen}
        copy={copy}
        language={language}
        members={enrichedPlan.members}
        defaultDate={day?.date ?? enrichedPlan.startDate}
        planId={planId}
        onClose={() => setBudgetModalOpen(false)}
        onSave={handleSaveBudgetEntry}
      />

      <PlacePickModal
        visible={!viewOnly && scheduleModal.kind === 'pick' && !!pickRoute}
        anchor={pickRoute?.location}
        language={language}
        showTransportMode
        defaultLegMode={pickRoute?.legMode ?? 'walk'}
        useTourApiNearby
        copy={{
          title: copy.rebootModalTitle,
          subtitle: pickRoute ? copy.rebootModalSub(pickRoute.placeName) : undefined,
          nearbyTitle: copy.rebootNearbyTitle,
          searchPlaceholder: copy.rebootSearchPlaceholder,
          searchEmpty: copy.rebootSearchEmpty,
          applyLabel: copy.rebootApply,
          cancelLabel: copy.rebootCancel,
          distance: copy.rebootDistance,
          ...transportCopy,
        }}
        excludePlaceIds={schedulePlaceIds}
        onClose={closeScheduleModal}
        onSelect={handlePickReplacement}
      />

      <PlacePickModal
        visible={!viewOnly && scheduleModal.kind === 'add'}
        anchor={addPlaceAnchor}
        language={language}
        showTransportMode
        defaultLegMode="walk"
        useTourApiNearby
        copy={{
          title: copy.addPlaceTitle,
          subtitle: copy.addPlaceSub,
          nearbyTitle: copy.addPlaceBrowseTitle,
          searchPlaceholder: copy.rebootSearchPlaceholder,
          searchEmpty: copy.rebootSearchEmpty,
          applyLabel: copy.addPlaceConfirm,
          cancelLabel: copy.addPlaceClose,
          distance: copy.rebootDistance,
          ...transportCopy,
        }}
        excludePlaceIds={schedulePlaceIds}
        onClose={closeScheduleModal}
        onSelect={handleAddPlace}
      />

      <PlaceReviewFormModal
        visible={!viewOnly && !!reviewFormRoute}
        route={reviewFormRoute}
        existing={reviewFormExisting}
        copy={reviewCopy}
        language={language}
        saving={savingReview}
        onClose={() => {
          if (!savingReview) {
            setReviewFormRoute(null);
          }
        }}
        onSave={handleSavePlaceReview}
        onDelete={reviewFormExisting ? handleDeletePlaceReview : undefined}
      />

      <TravelInviteLinkModal
        visible={inviteModalOpen}
        copy={copy}
        inviteLink={inviteLink}
        expiredAt={inviteExpiredAt}
        loading={inviteLoading}
        errorMessage={inviteError}
        onClose={closeInviteModal}
        onRetry={() => void loadInviteLink()}
      />

      <MemberActionsModal
        visible={Boolean(selectedMember)}
        copy={copy}
        roleLabels={roleLabels}
        member={selectedMember}
        canTransfer={canTransferSelected}
        canKick={canKickSelected}
        busy={memberActionBusy}
        errorMessage={memberActionError}
        onClose={closeMemberActions}
        onTransfer={requestTransferLeader}
        onKick={requestKickMember}
      />

      <TransientBottomToast
        text={toastText}
        opacity={toastOpacity}
        bottom={toastBottom}
      />

      <HomePlanPickerModal
        visible={planPickerOpen}
        plans={pickerPlans}
        selectedPlanId={enrichedPlan.planId}
        language={language}
        copy={pickerCopy}
        title={offlineMode ? setupCopy.offlinePickTitle : undefined}
        subtitle={offlineMode ? setupCopy.offlinePickSubtitle : undefined}
        onClose={closePlanPicker}
        onSelect={selectPlan}
        onCreatePress={offlineMode ? undefined : createNewPlan}
      />
    </View>
  );
}
