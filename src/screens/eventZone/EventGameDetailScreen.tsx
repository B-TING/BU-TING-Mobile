import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { AppIcon } from '../../components/shared/icons/AppIcon';
import type { LucideIconName } from '../../constants/icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventActionButton } from '../../components/eventZone/EventActionButton';
import { EventCallout } from '../../components/eventZone/EventCallout';
import { EventGameHero } from '../../components/eventZone/EventGameHero';
import { EventInfoCard } from '../../components/eventZone/EventInfoCard';
import { EventMissionCard } from '../../components/eventZone/EventMissionCard';
import { EventNavHeader } from '../../components/eventZone/EventNavHeader';
import { EventStatRow } from '../../components/eventZone/EventStatRow';
import {
  BRAND_MUTED,
  BRAND_PAGE_BG,
  BRAND_PRIMARY,
  EVENT_PINK_BG,
  EVENT_PINK_BORDER,
  EVENT_PINK_DARK,
  FEEDBACK_AMBER,
  FEEDBACK_AMBER_BG,
  FEEDBACK_AMBER_BORDER,
  FEEDBACK_INFO,
  FEEDBACK_INFO_BG,
  FEEDBACK_INFO_BORDER,
} from '../../components/eventZone/eventZoneTheme';
import {
  EVENT_ZONE_BY_ID,
  eventZoneName,
} from '../../constants/eventZone/eventZone';
import type { ZoneEventRewardSummary } from '../../types/eventZone';
import {
  listEventAuthTargets,
  resolveEventAuthTarget,
  isPhase1EventGame,
} from '../../constants/eventZone/eventGame';
import type { RadiusGateResult } from '../../hooks/eventZone/useEventAuthRadiusGate';
import { useEventAuthRadiusGate } from '../../hooks/eventZone/useEventAuthRadiusGate';
import { useJoinZoneEvent } from '../../hooks/eventZone/useJoinZoneEvent';
import { useHydrateMyEventParticipations, useHydrateZoneEventDetail } from '../../hooks/eventZone/useHydrateZoneEvents';
import { useLocationCache } from '../../hooks/location/useLocationCache';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import {
  useEventParticipationStore,
  useZoneEventStore,
} from '../../stores';
import { getCachedCoordinates } from '../../stores/useLocationStore';
import { useAppAlert } from '../../components/shared/modals';
import { zoneEventTypeCode } from '../../constants/eventZone/zoneEvents';
import {
  formatZoneEventRemaining,
  useZoneEventRemaining,
} from '../../utils/eventZone/zoneEventRemaining';

type Props = NativeStackScreenProps<RootStackParamList, 'EventGameDetail'>;

function isServerParticipationId(id: string | undefined): id is string {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

// ─── 반경 체크 결과 모달 ────────────────────────────────────────────
type RadiusModalConfig = {
  icon: LucideIconName;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  tone: 'warning' | 'info' | 'event';
};

function buildRadiusModalConfig(
  result: RadiusGateResult,
  copy: ReturnType<typeof useCopy<'eventGame'>>,
): RadiusModalConfig | null {
  if (result.status === 'inside') return null;

  if (result.status === 'outside') {
    const body =
      result.distanceM != null
        ? copy.outOfRadiusMessage(result.distanceM, result.radiusM)
        : copy.outOfRadiusHint;
    return {
      icon: 'mapPin',
      iconColor: '#EA580C',
      iconBg: '#FFEDD5',
      title: copy.outOfRadiusTitle,
      body,
      tone: 'warning',
    };
  }

  if (result.status === 'consent_denied' || result.status === 'permission_denied') {
    return {
      icon: 'alertTriangle',
      iconColor: '#0077B6',
      iconBg: '#DBEAFE',
      title: copy.locationDeniedTitle,
      body: copy.locationDeniedMessage,
      tone: 'info',
    };
  }

  return {
    icon: 'satellite',
    iconColor: '#EA580C',
    iconBg: '#FFEDD5',
    title: copy.locationUnavailableTitle,
    body: copy.locationUnavailableMessage,
    tone: 'warning',
  };
}

const TONE_STYLE: Record<
  'warning' | 'info' | 'event',
  { bg: string; border: string; title: string }
> = {
  warning: { bg: FEEDBACK_AMBER_BG, border: FEEDBACK_AMBER_BORDER, title: FEEDBACK_AMBER },
  info: { bg: FEEDBACK_INFO_BG, border: FEEDBACK_INFO_BORDER, title: FEEDBACK_INFO },
  event: { bg: EVENT_PINK_BG, border: EVENT_PINK_BORDER, title: EVENT_PINK_DARK },
};

function formatRewardSummary(
  reward: ZoneEventRewardSummary | undefined,
  copy: {
    submitRewardPoints: (n: number) => string;
    rewardBadge: (code: string) => string;
    rewardTopN: (n: number) => string;
  },
): string | null {
  if (!reward) {
    return null;
  }
  const parts: string[] = [];
  if (reward.points != null) {
    parts.push(copy.submitRewardPoints(reward.points));
  }
  if (reward.badgeCode) {
    parts.push(copy.rewardBadge(reward.badgeCode));
  }
  if (reward.topN != null) {
    parts.push(copy.rewardTopN(reward.topN));
  }
  if (reward.prizeRewardCode) {
    parts.push(reward.prizeRewardCode);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

// ─── Screen ────────────────────────────────────────────────────────
export function EventGameDetailScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('eventGame');
  const zoneCopy = useCopy('eventZone');
  const { checking, assertWithinRadius } = useEventAuthRadiusGate();
  const { accessToken, joining, join } = useJoinZoneEvent();
  const { alert } = useAppAlert();
  useLocationCache();

  const [radiusModal, setRadiusModal] = useState<RadiusModalConfig | null>(null);

  const activeEventsByZone = useZoneEventStore(s => s.activeEventsByZone);
  const { loading: detailLoading } = useHydrateZoneEventDetail(eventId);
  useHydrateMyEventParticipations(eventId);
  const beginParticipation = useEventParticipationStore(s => s.beginParticipation);
  const participation = useEventParticipationStore(s =>
    s.records.find(item => item.eventId === eventId),
  );
  const event = useMemo(
    () => Object.values(activeEventsByZone).find(item => item?.id === eventId),
    [activeEventsByZone, eventId],
  );

  const remainingMs = useZoneEventRemaining(event);

  const authTargets = useMemo(
    () => (event ? listEventAuthTargets(event) : []),
    [event],
  );

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  const effectiveTargetId = useMemo(() => {
    if (participation?.targetId) {
      return participation.targetId;
    }
    if (selectedTargetId) {
      return selectedTargetId;
    }
    if (authTargets.length === 1) {
      return authTargets[0].targetId;
    }
    return null;
  }, [authTargets, participation?.targetId, selectedTargetId]);

  if ((!event || !isPhase1EventGame(event)) && detailLoading) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ paddingTop: insets.top, backgroundColor: BRAND_PAGE_BG }}>
        <Text className="text-center" style={{ color: BRAND_MUTED }}>
          …
        </Text>
      </View>
    );
  }

  if (!event || !isPhase1EventGame(event)) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ paddingTop: insets.top, backgroundColor: BRAND_PAGE_BG }}>
        <Text className="text-center" style={{ color: BRAND_MUTED }}>{zoneCopy.eventEnded}</Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-4">
          <Text className="font-semibold" style={{ color: BRAND_PRIMARY }}>{copy.done}</Text>
        </Pressable>
      </View>
    );
  }

  const zone = EVENT_ZONE_BY_ID[event.zoneId];
  const authTarget = resolveEventAuthTarget(event, effectiveTargetId);
  const remainingText = formatZoneEventRemaining(remainingMs, language);
  const typeLabel =
    zoneEventTypeCode(event) === 'PLACE_AUTH' ? copy.typePlaceAuth : copy.typeObjectSight;
  const targetLocked =
    participation != null &&
    (participation.status === 'pending_review' ||
      participation.status === 'approved' ||
      participation.status === 'rejected' ||
      (participation.status === 'in_progress' && participation.targetId != null));

  const statusLabel = (() => {
    if (!participation) return copy.statusNotJoined;
    if (participation.status === 'pending_review') return copy.statusPendingReview;
    if (participation.status === 'approved') return copy.statusCompleted;
    if (participation.status === 'rejected') return copy.statusRejected;
    return copy.statusInProgress;
  })();

  const participationBlocked =
    participation?.status === 'pending_review' ||
    participation?.status === 'approved' ||
    participation?.status === 'rejected';

  const remainingAttempts = event.myRemainingAttempts;
  const attemptsExhausted =
    remainingAttempts === 0 && participation?.status !== 'in_progress';
  const baseRewardTitle = formatRewardSummary(event.baseReward, copy);
  const excellenceRewardTitle = formatRewardSummary(event.excellenceReward, copy);

  const canCapture =
    remainingMs > 0 &&
    !checking &&
    !joining &&
    !participationBlocked &&
    !attemptsExhausted &&
    effectiveTargetId != null &&
    (participation == null || participation.status === 'in_progress');

  const participateLabel = (() => {
    if (checking || joining) return copy.checkingLocation;
    if (participation?.status === 'pending_review') return copy.pendingReviewTitle;
    if (participation?.status === 'approved') return copy.statusCompleted;
    if (participation?.status === 'rejected') return copy.statusRejected;
    if (participation?.status === 'in_progress') return copy.continueCapture;
    if (attemptsExhausted) return copy.remainingAttemptsNone;
    if (effectiveTargetId == null) return copy.selectTargetRequired;
    return copy.participate;
  })();

  const rulesText =
    event.type === 'PLACE_AUTH' ? copy.placeAuthRules : copy.objectSightRules;

  const handleParticipate = async () => {
    if (!canCapture || !effectiveTargetId) return;
    if (!accessToken) {
      navigation.navigate('Login');
      return;
    }
    const within = await assertWithinRadius(
      event,
      result => {
        const config = buildRadiusModalConfig(result, copy);
        if (config) setRadiusModal(config);
      },
      effectiveTargetId,
    );
    if (!within) return;

    const openServerId = isServerParticipationId(event.myOpenParticipationId)
      ? event.myOpenParticipationId
      : isServerParticipationId(participation?.id) && participation?.status === 'in_progress'
        ? participation.id
        : undefined;

    const goToCamera = (participationId: string) => {
      if (beginParticipation(event, effectiveTargetId, participationId) === 'blocked') {
        return;
      }
      navigation.navigate('EventGameCamera', {
        eventId: event.id,
        targetId: effectiveTargetId,
        participationId,
      });
    };

    if (openServerId) {
      goToCamera(openServerId);
      return;
    }

    const coords = getCachedCoordinates();
    if (!coords) {
      const config = buildRadiusModalConfig({ status: 'location_unavailable' }, copy);
      if (config) setRadiusModal(config);
      return;
    }

    const result = await join(event.id, coords);
    if (result.status === 'unauthenticated') {
      navigation.navigate('Login');
      return;
    }
    if (result.status === 'out_of_range') {
      const config = buildRadiusModalConfig(
        {
          status: 'outside',
          distanceM: result.distanceMeters,
          radiusM: authTarget?.radiusM ?? 0,
        },
        copy,
      );
      if (config) setRadiusModal(config);
      return;
    }
    if (result.status === 'error') {
      alert({
        title: copy.outOfRadiusTitle,
        message: result.message,
      });
      return;
    }
    goToCamera(result.participationId);
  };

  const statItems = [
    { label: copy.statusTitle, value: statusLabel },
    ...(event.slotCode
      ? [{ label: language === 'ko' ? '슬롯' : 'Slot', value: event.slotCode }]
      : []),
    ...(authTarget
      ? [{ label: copy.radiusTitle, value: copy.radiusLabel(authTarget.radiusM) }]
      : []),
    {
      label: language === 'ko' ? '남은 시간' : 'Remaining',
      value: remainingMs > 0 ? remainingText : '-',
    },
  ];

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingTop: insets.top }}>
      <View className="border-b border-[#E2E8F0] bg-white px-2">
        <EventNavHeader
          title={copy.detailTitle}
          subtitle={eventZoneName(zone, language)}
          onBack={() => navigation.goBack()}
          backAccessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          rightAccessory={
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('EventAlbum', {
                  eventId: event.id,
                  zoneId: event.zoneId,
                })
              }
              className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 active:opacity-80">
              <Text className="text-xs font-semibold text-[#0077B6]">{copy.albumOpen}</Text>
            </Pressable>
          }
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}>
        <EventGameHero label={event.titleKo} />
        <EventMissionCard
          event={event}
          language={language}
          endsInLabel={copy.remainingLabel}
          endedLabel={zoneCopy.eventEnded}
        />
        <EventStatRow items={statItems} />

        {participation?.status === 'rejected' ? (
          <EventCallout tone="warning" title={copy.statusRejected} body={copy.rejectedHint} />
        ) : participation?.status === 'pending_review' ? (
          <EventCallout tone="info" title={copy.pendingReviewTitle} body={copy.pendingReviewMessage} />
        ) : participation?.status === 'approved' ? (
          <EventCallout tone="event" title={copy.statusCompleted} body={copy.pendingReviewMessage} />
        ) : attemptsExhausted ? (
          <EventCallout
            tone="warning"
            title={copy.remainingAttemptsNone}
            body={
              event.successLimitPerUser != null
                ? copy.successLimitHint(event.successLimitPerUser)
                : copy.rewardHint
            }
          />
        ) : null}

        <EventInfoCard label={copy.rulesTitle} title={typeLabel} body={rulesText} tone="default" />

        {baseRewardTitle ? (
          <EventInfoCard
            label={copy.baseRewardLabel}
            title={baseRewardTitle}
            body={copy.rewardAfterReview}
            tone="event"
          />
        ) : null}

        {excellenceRewardTitle ? (
          <EventInfoCard
            label={copy.excellenceRewardLabel}
            title={excellenceRewardTitle}
            body={copy.excellenceRewardHint}
            tone="success"
          />
        ) : null}

        {remainingAttempts != null ? (
          <EventInfoCard
            label={copy.remainingAttemptsLabel}
            title={copy.remainingAttemptsValue(remainingAttempts)}
            body={
              event.successLimitPerUser != null
                ? copy.successLimitHint(event.successLimitPerUser)
                : undefined
            }
            tone={remainingAttempts === 0 ? 'warning' : 'default'}
          />
        ) : null}

        {event.slotCode ? (
          <EventInfoCard
            label={copy.slotLabel(event.slotCode)}
            title={event.titleKo}
            body={copy.selectTargetHint}
            tone="default"
          />
        ) : null}

        <View className="rounded-2xl border border-[#E2E8F0] bg-white px-3.5 py-3">
          <Text className="text-[12px] font-semibold uppercase tracking-wide text-[#64748B]">
            {event.type === 'PLACE_AUTH' ? copy.targetPlace : copy.targetObject}
          </Text>
          <Text className="mt-1 text-[13px] leading-[18px] text-[#475569]">
            {copy.selectTargetHint}
          </Text>
          <View className="mt-3 gap-2">
            {authTargets.map(target => {
              const selected = effectiveTargetId === target.targetId;
              const title =
                event.type === 'OBJECT_AUTH' && target.objectLabelKo
                  ? `${target.emoji ?? '📷'} ${target.objectLabelKo}`
                  : `${target.emoji ?? '📍'} ${target.placeNameKo}`;
              const body =
                event.type === 'OBJECT_AUTH'
                  ? target.placeNameKo
                  : `GPS ${target.latitude.toFixed(4)}, ${target.longitude.toFixed(4)}`;
              return (
                <Pressable
                  key={target.targetId}
                  disabled={targetLocked}
                  onPress={() => setSelectedTargetId(target.targetId)}
                  className="rounded-xl border px-3 py-3 active:opacity-80"
                  style={{
                    borderColor: selected ? EVENT_PINK_BORDER : '#E2E8F0',
                    backgroundColor: selected ? EVENT_PINK_BG : '#FFFFFF',
                    opacity: targetLocked && !selected ? 0.55 : 1,
                  }}>
                  <Text
                    className="text-[14px] font-bold leading-5"
                    style={{ color: selected ? EVENT_PINK_DARK : '#0F172A' }}>
                    {title}
                  </Text>
                  <Text className="mt-1 text-[12px] leading-[17px] text-[#64748B]">{body}</Text>
                  <Text className="mt-1 text-[12px] text-[#94A3B8]">
                    {copy.radiusLabel(target.radiusM)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {authTarget ? (
          <EventInfoCard
            label={copy.radiusTitle}
            title={copy.radiusLabel(authTarget.radiusM)}
            body={copy.radiusHint}
            tone="success"
          />
        ) : null}
      </ScrollView>

      <View
        className="border-t border-[#E2E8F0] bg-white px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}>
        <EventActionButton
          label={participateLabel}
          variant={canCapture ? 'event' : 'ghost'}
          disabled={!canCapture}
          onPress={handleParticipate}
        />
      </View>

      <Modal
        visible={radiusModal != null}
        transparent
        animationType="fade"
        onRequestClose={() => setRadiusModal(null)}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 px-6"
          onPress={() => setRadiusModal(null)}>
          <Pressable onPress={e => e.stopPropagation()}>
            {radiusModal ? (
              <View
                className="w-full max-w-sm overflow-hidden rounded-3xl"
                style={{
                  backgroundColor: TONE_STYLE[radiusModal.tone].bg,
                  borderWidth: 1,
                  borderColor: TONE_STYLE[radiusModal.tone].border,
                }}>
                <View className="items-center px-6 pt-8 pb-4">
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: radiusModal.iconBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <AppIcon name={radiusModal.icon} size={28} color={radiusModal.iconColor} />
                  </View>
                  <Text
                    className="mt-4 text-center text-[17px] font-bold leading-6"
                    style={{ color: TONE_STYLE[radiusModal.tone].title }}>
                    {radiusModal.title}
                  </Text>
                  <Text className="mt-2 text-center text-[13px] leading-[20px] text-[#475569]">
                    {radiusModal.body}
                  </Text>
                </View>
                <View className="border-t border-[#E2E8F0]">
                  <Pressable
                    onPress={() => setRadiusModal(null)}
                    className="items-center py-4 active:opacity-70">
                    <Text
                      className="text-[15px] font-bold"
                      style={{ color: TONE_STYLE[radiusModal.tone].title }}>
                      {copy.done}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
