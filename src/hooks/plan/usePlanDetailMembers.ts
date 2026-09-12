import { useCallback, useMemo, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppAlert, useFeatureUnavailableAlert } from '../../components/shared/modals';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../../constants/common/alphaFeatureBlocks';
import { useCopy } from '../../i18n';
import { navigateToMainTab } from '../../navigation/navigateToMainTab';
import type { RootStackParamList } from '../../navigation/types';
import {
  leaveTravelTeam,
  removeTravelMember,
  resolveTravelInviteLink,
  transferTravelLeader,
} from '../../services/travel/travelTeamService';
import { TravelServiceError } from '../../services/travel/travelService';
import { usePlanStore } from '../../stores';
import type { PlanMember, TravelPlan } from '../../types/travelPlan';

type UsePlanDetailMembersParams = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlanDetail'>;
  plan: TravelPlan | null;
  planId: string;
  travelId: string | undefined;
  accessToken: string | null | undefined;
  authUserId: string | undefined;
  isApiPlan: boolean;
  offlineMode: boolean;
  syncMembers: () => Promise<unknown> | void;
};

/** 초대 · 리더 위임 · 강퇴 · 나가기 */
export function usePlanDetailMembers({
  navigation,
  plan,
  planId,
  travelId,
  accessToken,
  authUserId,
  isApiPlan,
  offlineMode,
  syncMembers,
}: UsePlanDetailMembersParams) {
  const copy = useCopy('planDetail');
  const { alert } = useAppAlert();
  const { showUnavailable } = useFeatureUnavailableAlert();
  const completePlan = usePlanStore(s => s.completePlan);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteExpiredAt, setInviteExpiredAt] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [leavingTrip, setLeavingTrip] = useState(false);
  const [selectedMember, setSelectedMember] = useState<PlanMember | null>(null);
  const [memberActionBusy, setMemberActionBusy] = useState(false);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);

  const canInvite = useMemo(() => {
    if (!isApiPlan || !authUserId || !plan) {
      return false;
    }
    return plan.members.some(
      member => member.userId === authUserId && member.role === 'LEADER',
    );
  }, [authUserId, isApiPlan, plan]);

  const canLeaveTrip = useMemo(() => {
    if (!isApiPlan || offlineMode || !authUserId || !plan) {
      return false;
    }
    return plan.members.some(member => member.userId === authUserId);
  }, [authUserId, isApiPlan, offlineMode, plan]);

  const canTransferSelected = useMemo(() => {
    if (!canInvite || offlineMode || !selectedMember) {
      return false;
    }
    return selectedMember.role !== 'LEADER';
  }, [canInvite, offlineMode, selectedMember]);

  const canKickSelected = useMemo(() => {
    if (!canInvite || offlineMode || !selectedMember || !authUserId) {
      return false;
    }
    return (
      selectedMember.userId !== authUserId && selectedMember.role !== 'LEADER'
    );
  }, [authUserId, canInvite, offlineMode, selectedMember]);

  const loadInviteLink = useCallback(async () => {
    if (!accessToken || !travelId) {
      return;
    }
    setInviteLoading(true);
    setInviteError(null);
    try {
      const result = await resolveTravelInviteLink(accessToken, travelId);
      setInviteLink(result.inviteLink);
      setInviteExpiredAt(result.expiredAt ?? null);
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : copy.inviteLinkError);
      setInviteLink(null);
      setInviteExpiredAt(null);
    } finally {
      setInviteLoading(false);
    }
  }, [accessToken, copy.inviteLinkError, travelId]);

  const handleInvite = useCallback(() => {
    if (isAlphaFeatureBlocked('invite')) {
      showUnavailable(ALPHA_FEATURE_LABELS.invite);
      return;
    }
    if (!canInvite) {
      alert({ title: copy.inviteMembers, message: copy.inviteLeaderOnly });
      return;
    }
    setInviteModalOpen(true);
    void loadInviteLink();
  }, [
    alert,
    canInvite,
    copy.inviteLeaderOnly,
    copy.inviteMembers,
    loadInviteLink,
    showUnavailable,
  ]);

  const closeInviteModal = useCallback(() => {
    setInviteModalOpen(false);
    setInviteLink(null);
    setInviteExpiredAt(null);
    setInviteError(null);
    void syncMembers();
  }, [syncMembers]);

  const openMemberActions = useCallback(
    (member: PlanMember) => {
      if (!authUserId || member.userId === authUserId) {
        return;
      }
      setMemberActionError(null);
      setSelectedMember(member);
    },
    [authUserId],
  );

  const closeMemberActions = useCallback(() => {
    if (memberActionBusy) {
      return;
    }
    setSelectedMember(null);
    setMemberActionError(null);
  }, [memberActionBusy]);

  const resetMemberUiOnPlanChange = useCallback(() => {
    setSelectedMember(null);
    setMemberActionError(null);
    setInviteModalOpen(false);
  }, []);

  const handleTransferLeader = useCallback(async () => {
    if (!accessToken || !travelId || !selectedMember || memberActionBusy) {
      return;
    }
    setMemberActionBusy(true);
    setMemberActionError(null);
    try {
      await transferTravelLeader(accessToken, travelId, selectedMember.userId);
      await syncMembers();
      const name = selectedMember.nickname;
      setSelectedMember(null);
      alert({
        title: copy.transferLeader,
        message: copy.transferLeaderSuccess(name),
      });
    } catch (error) {
      setMemberActionError(
        error instanceof Error ? error.message : copy.transferLeaderFailed,
      );
    } finally {
      setMemberActionBusy(false);
    }
  }, [
    accessToken,
    alert,
    copy.transferLeader,
    copy.transferLeaderFailed,
    copy.transferLeaderSuccess,
    memberActionBusy,
    selectedMember,
    syncMembers,
    travelId,
  ]);

  const requestTransferLeader = useCallback(() => {
    if (!selectedMember || !canTransferSelected) {
      return;
    }
    alert({
      title: copy.transferLeaderConfirmTitle,
      message: copy.transferLeaderConfirmMessage(selectedMember.nickname),
      buttons: [
        { label: copy.close, variant: 'secondary', onPress: () => {} },
        {
          label: copy.transferLeaderConfirm,
          variant: 'primary',
          onPress: () => {
            void handleTransferLeader();
          },
        },
      ],
    });
  }, [
    alert,
    canTransferSelected,
    copy.close,
    copy.transferLeaderConfirm,
    copy.transferLeaderConfirmMessage,
    copy.transferLeaderConfirmTitle,
    handleTransferLeader,
    selectedMember,
  ]);

  const handleKickMember = useCallback(async () => {
    if (!accessToken || !travelId || !selectedMember || memberActionBusy) {
      return;
    }
    setMemberActionBusy(true);
    setMemberActionError(null);
    try {
      await removeTravelMember(accessToken, travelId, selectedMember.userId);
      await syncMembers();
      const name = selectedMember.nickname;
      setSelectedMember(null);
      alert({
        title: copy.kickMember,
        message: copy.kickMemberSuccess(name),
      });
    } catch (error) {
      setMemberActionError(
        error instanceof Error ? error.message : copy.kickMemberFailed,
      );
    } finally {
      setMemberActionBusy(false);
    }
  }, [
    accessToken,
    alert,
    copy.kickMember,
    copy.kickMemberFailed,
    copy.kickMemberSuccess,
    memberActionBusy,
    selectedMember,
    syncMembers,
    travelId,
  ]);

  const requestKickMember = useCallback(() => {
    if (!selectedMember || !canKickSelected) {
      return;
    }
    alert({
      title: copy.kickMemberConfirmTitle,
      message: copy.kickMemberConfirmMessage(selectedMember.nickname),
      buttons: [
        { label: copy.close, variant: 'secondary', onPress: () => {} },
        {
          label: copy.kickMemberConfirm,
          variant: 'danger',
          onPress: () => {
            void handleKickMember();
          },
        },
      ],
    });
  }, [
    alert,
    canKickSelected,
    copy.close,
    copy.kickMemberConfirm,
    copy.kickMemberConfirmMessage,
    copy.kickMemberConfirmTitle,
    handleKickMember,
    selectedMember,
  ]);

  const handleLeaveTrip = useCallback(async () => {
    if (!accessToken || !travelId || !planId || leavingTrip) {
      return;
    }
    setLeavingTrip(true);
    try {
      await leaveTravelTeam(accessToken, travelId);
      completePlan(planId);
      navigateToMainTab(navigation, 'home');
    } catch (error) {
      const isLeaderBlocked =
        error instanceof TravelServiceError && error.status === 409;
      alert({
        title: copy.leaveTrip,
        message: isLeaderBlocked
          ? copy.leaveTripLeaderBlocked
          : error instanceof Error
            ? error.message
            : copy.leaveTripFailed,
      });
    } finally {
      setLeavingTrip(false);
    }
  }, [
    accessToken,
    alert,
    completePlan,
    copy.leaveTrip,
    copy.leaveTripFailed,
    copy.leaveTripLeaderBlocked,
    leavingTrip,
    navigation,
    planId,
    travelId,
  ]);

  const requestLeaveTrip = useCallback(() => {
    if (!canLeaveTrip || leavingTrip || !plan || !authUserId) {
      return;
    }
    const isLeader = plan.members.some(
      member => member.userId === authUserId && member.role === 'LEADER',
    );
    if (isLeader && plan.members.length > 1) {
      alert({
        title: copy.leaveTrip,
        message: copy.leaveTripLeaderBlocked,
      });
      return;
    }
    alert({
      title: copy.leaveTripConfirmTitle,
      message: copy.leaveTripConfirmMessage,
      buttons: [
        { label: copy.close, variant: 'secondary', onPress: () => {} },
        {
          label: copy.leaveTripConfirm,
          variant: 'danger',
          onPress: () => {
            void handleLeaveTrip();
          },
        },
      ],
    });
  }, [
    alert,
    authUserId,
    canLeaveTrip,
    copy.close,
    copy.leaveTrip,
    copy.leaveTripConfirm,
    copy.leaveTripConfirmMessage,
    copy.leaveTripConfirmTitle,
    copy.leaveTripLeaderBlocked,
    handleLeaveTrip,
    leavingTrip,
    plan,
  ]);

  return {
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
    handleInvite,
    closeInviteModal,
    loadInviteLink,
    openMemberActions,
    closeMemberActions,
    requestTransferLeader,
    requestKickMember,
    requestLeaveTrip,
    resetMemberUiOnPlanChange,
  };
}
