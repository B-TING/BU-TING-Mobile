import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, CameraType, type CameraApi } from 'react-native-camera-kit';

import { EventChip } from '../../components/eventZone/EventChip';
import { BRAND_BORDER, BRAND_MUTED, BRAND_TEXT } from '../../components/eventZone/eventZoneTheme';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { useAppAlert } from '../../components/shared/modals';
import { MediaPermissionDisclosure } from '../../components/review/modals/MediaPermissionDisclosure';
import { ICON_COLOR_WHITE } from '../../constants/icons';
import {
  eventGameObjectLabel,
  isPhase1EventGame,
  resolveEventAuthTarget,
} from '../../constants/eventZone/eventGame';
import type { RadiusGateResult } from '../../hooks/eventZone/useEventAuthRadiusGate';
import { useEventAuthRadiusGate } from '../../hooks/eventZone/useEventAuthRadiusGate';
import { useLocationCache } from '../../hooks/location/useLocationCache';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import {
  useEventParticipationStore,
  useZoneEventStore,
} from '../../stores';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import { getCachedCoordinates } from '../../stores/useLocationStore';
import { resolveEventAuthUserCoords } from '../../utils/eventZone/checkEventAuthLocation';
import { mapSubmitParticipationStatus } from '../../services/eventZone/zoneEventMapper';
import type {
  ZoneEventGrantedRewardResponse,
  ZoneEventSubmitResultResponse,
} from '../../types/zoneEventApi';
import type { EquippedTitleResponse } from '../../types/zoneTitleApi';
import {
  submitZoneEventParticipation,
  ZoneEventServiceError,
} from '../../services/eventZone/zoneEventService';
import { uploadFile } from '../../services/files/fileUploadService';
import {
  hasCameraPermission,
  requestCameraPermission,
} from '../../utils/media/mediaPermissions';
import { pickReviewMedia, type MediaPickAsset } from '../../utils/media/pickMedia';
import {
  isRetakeRequiredSubmitError,
  zoneEventSubmitErrorCopy,
} from '../../utils/eventZone/zoneEventSubmitError';

type Props = NativeStackScreenProps<RootStackParamList, 'EventGameCamera'>;

type CapturePhase = 'ready' | 'preview' | 'submitting' | 'pending' | 'success' | 'fail';

type SubmitExtras = {
  rewards: ZoneEventGrantedRewardResponse[];
  pointBalance?: number;
  newlyEarnedTitles: EquippedTitleResponse[];
};

function toUploadInput(asset: MediaPickAsset) {
  const mime =
    asset.mimeType === 'image/png'
      ? 'image/png'
      : asset.mimeType === 'image/webp'
        ? 'image/webp'
        : 'image/jpeg';
  return {
    uri: asset.uri,
    type: mime,
    name: asset.fileName || `zone-event-${Date.now()}.jpg`,
  };
}

function extrasFromSubmit(result: ZoneEventSubmitResultResponse): SubmitExtras {
  return {
    rewards: result.rewards ?? [],
    pointBalance: result.pointBalance,
    newlyEarnedTitles: result.newlyEarnedTitles ?? [],
  };
}

function hasSubmitExtras(extras: SubmitExtras | null): extras is SubmitExtras {
  return Boolean(
    extras &&
      (extras.rewards.length > 0 ||
        extras.newlyEarnedTitles.length > 0 ||
        extras.pointBalance != null),
  );
}

function rewardLine(
  reward: ZoneEventGrantedRewardResponse,
  pointsLabel: (n: number) => string,
): string {
  const name = reward.name || reward.code;
  const points = reward.pointAmount != null ? pointsLabel(reward.pointAmount) : null;
  if (name && points) {
    return `${name} · ${points}`;
  }
  return name || points || '';
}

export function EventGameCameraScreen({ navigation, route }: Props) {
  const { eventId, targetId, participationId } = route.params;
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('eventGame');
  const { alert } = useAppAlert();
  const { checking, assertWithinRadius } = useEventAuthRadiusGate();
  const accessToken = useAuthStore(selectReusableAccessToken);
  useLocationCache();

  const activeEventsByZone = useZoneEventStore(s => s.activeEventsByZone);
  const triggerEvent = useZoneEventStore(s => s.triggerEvent);
  const submitForReview = useEventParticipationStore(s => s.submitForReview);
  const eventFromStore = useMemo(
    () => Object.values(activeEventsByZone).find(item => item?.id === eventId),
    [activeEventsByZone, eventId],
  );
  const eventRef = useRef(eventFromStore);
  if (eventFromStore) {
    eventRef.current = eventFromStore;
  }
  const event = eventFromStore ?? eventRef.current;

  const cameraRef = useRef<CameraApi>(null);
  const [phase, setPhase] = useState<CapturePhase>('ready');
  const [previewAsset, setPreviewAsset] = useState<MediaPickAsset | null>(null);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [submitExtras, setSubmitExtras] = useState<SubmitExtras | null>(null);
  const [usedFileKeys, setUsedFileKeys] = useState<string[]>([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionPrompt, setPermissionPrompt] = useState<
    null | 'request' | 'blocked'
  >(null);

  useEffect(() => {
    if (!event || !isPhase1EventGame(event) || !participationId) {
      navigation.goBack();
    }
  }, [event, navigation, participationId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const granted = await hasCameraPermission();
      if (cancelled) {
        return;
      }
      if (granted) {
        setCameraReady(true);
        return;
      }
      setPermissionPrompt('request');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!event || !isPhase1EventGame(event) || !participationId) {
    return null;
  }

  const objectLabel = eventGameObjectLabel(event, language, targetId);
  const authTarget = resolveEventAuthTarget(event, targetId);
  const hintText =
    event.type === 'PLACE_AUTH'
      ? copy.cameraHintPlace
      : copy.cameraHintObject(objectLabel);

  const notifyRadiusResult = (result: RadiusGateResult) => {
    if (result.status === 'inside') {
      return;
    }
    if (result.status === 'outside') {
      alert({
        title: copy.outOfRadiusTitle,
        message:
          result.distanceM != null
            ? copy.outOfRadiusMessage(result.distanceM, result.radiusM)
            : copy.outOfRadiusHint,
      });
      return;
    }
    if (result.status === 'consent_denied' || result.status === 'permission_denied') {
      alert({
        title: copy.locationDeniedTitle,
        message: copy.locationDeniedMessage,
      });
      return;
    }
    alert({
      title: copy.locationUnavailableTitle,
      message: copy.locationUnavailableMessage,
    });
  };

  const mediaLabels = {
    title: copy.capture,
    chooseFromLibrary: copy.capture,
    takePhoto: copy.capture,
    takeVideo: copy.capture,
    cancel: copy.done,
    unsupportedVideoFormat: copy.captureFailed,
    unsupportedImageFormat: copy.captureFailed,
    fileTooLarge: copy.captureFailed,
  };

  const applyCapturedAsset = (asset: MediaPickAsset) => {
    setPreviewAsset(asset);
    setCapturedAt(new Date().toISOString());
    setPhase('preview');
  };

  const openSystemCamera = async () => {
    const result = await pickReviewMedia({
      mediaType: 'image',
      source: 'camera',
      labels: mediaLabels,
    });

    if (result.status === 'cancelled') {
      return;
    }
    if (result.status === 'denied') {
      setPermissionPrompt('blocked');
      return;
    }
    if (result.status === 'error') {
      alert({ title: copy.captureFailed, message: result.message });
      return;
    }

    applyCapturedAsset(result.asset);
  };

  const captureFromPreview = async () => {
    try {
      const captured = await cameraRef.current?.capture();
      if (!captured?.uri) {
        await openSystemCamera();
        return;
      }
      applyCapturedAsset({
        uri: captured.uri,
        type: 'image',
        fileName: captured.name || `zone-event-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      });
    } catch {
      await openSystemCamera();
    }
  };

  const ensureCameraAndCapture = async () => {
    const alreadyGranted = await hasCameraPermission();
    if (!alreadyGranted) {
      setPermissionPrompt('request');
      return;
    }
    setCameraReady(true);
    if (cameraRef.current) {
      await captureFromPreview();
      return;
    }
    await openSystemCamera();
  };

  const handlePermissionAllow = async () => {
    setPermissionPrompt(null);
    const result = await requestCameraPermission();
    if (result === 'blocked') {
      setPermissionPrompt('blocked');
      return;
    }
    if (result !== 'granted') {
      alert({
        title: copy.cameraPermissionTitle,
        message: copy.cameraPermissionMessage,
      });
      return;
    }
    setCameraReady(true);
  };

  const handleCapture = async () => {
    if (phase !== 'ready' || checking) {
      return;
    }

    const within = await assertWithinRadius(event, notifyRadiusResult, targetId);
    if (!within) {
      return;
    }

    await ensureCameraAndCapture();
  };

  const handleRetake = () => {
    setPreviewAsset(null);
    setCapturedAt(null);
    setSubmitExtras(null);
    setPhase('ready');
  };

  const handleSubmit = async () => {
    if (!previewAsset || phase !== 'preview') {
      return;
    }
    if (!accessToken) {
      navigation.navigate('Login');
      return;
    }

    const within = await assertWithinRadius(event, notifyRadiusResult, targetId);
    if (!within) {
      return;
    }

    const coords = resolveEventAuthUserCoords(event, getCachedCoordinates(), targetId);
    if (!coords) {
      alert({
        title: copy.locationUnavailableTitle,
        message: copy.locationUnavailableMessage,
      });
      return;
    }

    setPhase('submitting');
    try {
      const uploaded = await uploadFile(accessToken, toUploadInput(previewAsset));
      if (usedFileKeys.includes(uploaded.fileKey)) {
        handleRetake();
        alert({
          title: copy.captureFailed,
          message: copy.submitMediaAlreadyUsed,
        });
        return;
      }
      setUsedFileKeys(keys => [...keys, uploaded.fileKey]);
      const result = await submitZoneEventParticipation(
        accessToken,
        eventId,
        participationId,
        {
          targetId,
          mediaFileKey: uploaded.fileKey,
          latitude: coords.lat,
          longitude: coords.lng,
          capturedAt: capturedAt ?? new Date().toISOString(),
        },
      );
      const serverStatus = result.participation.status ?? 'UNDER_REVIEW';
      const localStatus = mapSubmitParticipationStatus(serverStatus);
      submitForReview(event, previewAsset.uri, targetId, localStatus);
      triggerEvent({
        ...event,
        myParticipationStatus: serverStatus,
        myParticipation: {
          participationId,
          status: serverStatus,
          canResubmit: localStatus === 'rejected',
        },
      });
      setSubmitExtras(extrasFromSubmit(result));
      if (localStatus === 'rejected') {
        setPhase('fail');
        return;
      }
      setPhase(localStatus === 'approved' ? 'success' : 'pending');
    } catch (error) {
      setPhase('preview');
      if (error instanceof ZoneEventServiceError) {
        if (error.status === 401) {
          navigation.navigate('Login');
          return;
        }
        if (error.distanceMeters != null) {
          alert({
            title: copy.outOfRadiusTitle,
            message: copy.outOfRadiusMessage(
              error.distanceMeters,
              authTarget?.radiusM ?? error.distanceMeters,
            ),
          });
          return;
        }
        const message = zoneEventSubmitErrorCopy(error, copy);
        if (isRetakeRequiredSubmitError(error)) {
          handleRetake();
        }
        alert({
          title: message === copy.submitDeadlinePassed ? copy.deadlinePassed : copy.captureFailed,
          message,
        });
        return;
      }
      alert({
        title: copy.captureFailed,
        message: error instanceof Error ? error.message : copy.captureFailed,
      });
    }
  };

  const handleCloseResult = () => {
    if (phase === 'fail') {
      handleRetake();
      return;
    }
    navigation.navigate('EventZone');
  };

  const busy = checking || phase === 'submitting';
  const resultVisible = phase === 'pending' || phase === 'success' || phase === 'fail';
  const resultTitle =
    phase === 'success'
      ? copy.successTitle
      : phase === 'fail'
        ? copy.failTitle
        : copy.pendingReviewTitle;
  const resultBody =
    phase === 'success'
      ? event.type === 'OBJECT_AUTH'
        ? copy.successObject(objectLabel)
        : copy.successPlace
      : phase === 'fail'
        ? event.type === 'OBJECT_AUTH'
          ? copy.failObject
          : copy.failPlace
        : copy.pendingReviewMessage;
  const resultAction = phase === 'fail' ? copy.retry : copy.done;
  const resultEmoji = phase === 'success' ? '🎉' : phase === 'fail' ? '⚠️' : '⏳';

  return (
    <View className="flex-1 bg-black">
      <View
        className="absolute left-0 right-0 z-10 flex-row items-center justify-between px-3"
        style={{ top: insets.top + 8 }}>
        <View className="rounded-full bg-black/50">
          <BackButton
            accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
            onPress={() => navigation.goBack()}
          />
        </View>
        <View className="rounded-full bg-black/50 px-3 py-1.5">
          <Text className="text-xs font-semibold text-white">{event.titleKo}</Text>
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <View className="aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl border-2 border-white/20 bg-neutral-900">
          {phase === 'preview' && previewAsset ? (
            <Image
              source={{ uri: previewAsset.uri }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : cameraReady ? (
            <Camera
              ref={cameraRef}
              style={styles.camera}
              cameraType={CameraType.Back}
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <View className="rounded-full border-2 border-dashed border-white/30 p-8">
                <AppIcon name="camera" size={56} color={ICON_COLOR_WHITE} />
              </View>
              <Text className="mt-4 px-6 text-center text-sm text-white/80">
                {hintText}
              </Text>
              <Text className="mt-2 px-6 text-center text-xs text-white/50">
                {copy.radiusHint}
              </Text>
            </View>
          )}

          {busy ? (
            <View className="absolute inset-0 items-center justify-center bg-black/70">
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text className="mt-3 text-sm font-semibold text-white">
                {checking ? copy.checkingLocation : copy.processing}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View
        className="items-center px-6 pb-4"
        style={{ paddingBottom: insets.bottom + 24 }}>
        {phase === 'preview' ? (
          <View className="w-full max-w-sm flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={handleRetake}
              className="flex-1 items-center rounded-2xl border border-white/40 py-3.5 active:opacity-80 disabled:opacity-40">
              <Text className="font-semibold text-white">{copy.retakePhoto}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                void handleSubmit();
              }}
              className="flex-1 items-center rounded-2xl bg-brand-primary py-3.5 active:opacity-90 disabled:opacity-40">
              <Text className="font-bold text-white">{copy.submitForReview}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.capture}
              disabled={phase !== 'ready' || busy}
              onPress={handleCapture}
              className="h-20 w-20 items-center justify-center rounded-full border-4 border-white active:opacity-80 disabled:opacity-40">
              <View className="h-14 w-14 rounded-full bg-white" />
            </Pressable>
            <Text className="mt-3 text-sm font-semibold text-white">
              {checking ? copy.checkingLocation : copy.capture}
            </Text>
          </>
        )}
      </View>

      <Modal visible={resultVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-brand-surface p-6" style={{ maxHeight: '80%' }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4 }}>
              <Text className="text-center text-4xl">{resultEmoji}</Text>
              <Text className="mt-3 text-center text-xl font-bold text-brand-text">
                {resultTitle}
              </Text>
              <Text className="mt-2 text-center text-sm leading-relaxed text-brand-muted">
                {resultBody}
              </Text>
              {previewAsset ? (
                <Image
                  source={{ uri: previewAsset.uri }}
                  accessibilityLabel={copy.submittedPhoto}
                  className="mt-4 h-44 w-full rounded-2xl bg-neutral-200"
                  resizeMode="cover"
                />
              ) : null}
              {phase === 'success' && hasSubmitExtras(submitExtras) ? (
                <View className="mt-4 gap-3">
                  {submitExtras.pointBalance != null ? (
                    <Text className="text-center text-[13px] font-semibold" style={{ color: BRAND_TEXT }}>
                      {copy.submitPointBalance(submitExtras.pointBalance)}
                    </Text>
                  ) : null}
                  {submitExtras.rewards.length > 0 ? (
                    <View
                      className="rounded-2xl border px-3.5 py-3"
                      style={{ borderColor: BRAND_BORDER }}>
                      <Text className="text-[12px] font-bold" style={{ color: BRAND_MUTED }}>
                        {copy.submitRewardsTitle}
                      </Text>
                      <View className="mt-2 gap-1.5">
                        {submitExtras.rewards.map((reward, index) => {
                          const line = rewardLine(reward, copy.submitRewardPoints);
                          if (!line) {
                            return null;
                          }
                          return (
                            <Text
                              key={reward.grantId || reward.code || `${reward.name}-${index}`}
                              className="text-[13px] leading-5"
                              style={{ color: BRAND_TEXT }}>
                              {line}
                            </Text>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                  {submitExtras.newlyEarnedTitles.length > 0 ? (
                    <View
                      className="rounded-2xl border px-3.5 py-3"
                      style={{ borderColor: BRAND_BORDER }}>
                      <Text className="text-[12px] font-bold" style={{ color: BRAND_MUTED }}>
                        {copy.submitNewTitlesTitle}
                      </Text>
                      <View className="mt-2 flex-row flex-wrap gap-1.5">
                        {submitExtras.newlyEarnedTitles.map(title => (
                          <EventChip
                            key={title.titleCode}
                            label={title.titleName}
                            variant="title"
                          />
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>
            <Pressable
              onPress={handleCloseResult}
              className="mt-6 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
              <Text className="font-bold text-white">{resultAction}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <MediaPermissionDisclosure
        visible={permissionPrompt != null}
        title={copy.cameraPermissionTitle}
        disclosure={copy.cameraPermissionMessage}
        detail={copy.cameraPermissionMessage}
        allowLabel={copy.cameraPermissionAllow}
        denyLabel={copy.cameraPermissionDeny}
        openSettingsLabel={copy.cameraPermissionAllow}
        mode={permissionPrompt === 'blocked' ? 'blocked' : 'request'}
        onAllow={() => {
          void handlePermissionAllow();
        }}
        onDeny={() => setPermissionPrompt(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});
