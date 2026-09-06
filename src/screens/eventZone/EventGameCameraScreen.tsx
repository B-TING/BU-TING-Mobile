import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { useAppAlert } from '../../components/shared/modals';
import { MediaPermissionDisclosure } from '../../components/review/modals/MediaPermissionDisclosure';
import { ICON_COLOR_WHITE } from '../../constants/icons';
import {
  eventGameObjectLabel,
  isCameraEventGame,
} from '../../constants/eventZone/eventGame';
import { useEventAuthRadiusGate } from '../../hooks/eventZone/useEventAuthRadiusGate';
import { useLocationCache } from '../../hooks/location/useLocationCache';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import {
  useEventParticipationStore,
  useZoneEventStore,
} from '../../stores';
import {
  hasCameraPermission,
  requestCameraPermission,
} from '../../utils/media/mediaPermissions';
import { pickReviewMedia } from '../../utils/media/pickMedia';

type Props = NativeStackScreenProps<RootStackParamList, 'EventGameCamera'>;

type CapturePhase = 'ready' | 'preview' | 'submitting' | 'pending';

export function EventGameCameraScreen({ navigation, route }: Props) {
  const { eventId, targetId, participationId } = route.params;
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('eventGame');
  const { alert } = useAppAlert();
  const { checking, assertWithinRadius } = useEventAuthRadiusGate();
  useLocationCache();

  const activeEventsByZone = useZoneEventStore(s => s.activeEventsByZone);
  const submitForReview = useEventParticipationStore(s => s.submitForReview);
  const event = useMemo(
    () => Object.values(activeEventsByZone).find(item => item?.id === eventId),
    [activeEventsByZone, eventId],
  );

  const [phase, setPhase] = useState<CapturePhase>('ready');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [permissionPrompt, setPermissionPrompt] = useState<
    null | 'request' | 'blocked'
  >(null);

  useEffect(() => {
    if (!event || !isCameraEventGame(event) || !participationId) {
      navigation.goBack();
    }
  }, [event, navigation, participationId]);

  if (!event || !isCameraEventGame(event) || !participationId) {
    return null;
  }

  const objectLabel = eventGameObjectLabel(event, language, targetId);
  const hintText =
    event.type === 'PLACE_AUTH'
      ? copy.cameraHintPlace
      : copy.cameraHintObject(objectLabel);

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

    setImageUri(result.asset.uri);
    setPhase('preview');
  };

  const ensureCameraAndCapture = async () => {
    const alreadyGranted = await hasCameraPermission();
    if (!alreadyGranted) {
      setPermissionPrompt('request');
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
    await openSystemCamera();
  };

  const handleCapture = async () => {
    if (phase !== 'ready' || checking) {
      return;
    }

    const within = await assertWithinRadius(event, undefined, targetId);
    if (!within) {
      return;
    }

    await ensureCameraAndCapture();
  };

  const handleRetake = () => {
    setImageUri(null);
    setPhase('ready');
  };

  const handleSubmit = () => {
    if (!imageUri || phase !== 'preview') {
      return;
    }

    setPhase('submitting');

    submitForReview(event, imageUri, targetId);
    setPhase('pending');
  };

  const handleClosePending = () => {
    navigation.navigate('EventZone');
  };

  const busy = checking || phase === 'submitting';

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
          {phase === 'preview' && imageUri ? (
            <Image
              source={{ uri: imageUri }}
              className="h-full w-full"
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
              onPress={handleSubmit}
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

      <Modal visible={phase === 'pending'} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-brand-surface p-6">
            <Text className="text-center text-4xl">⏳</Text>
            <Text className="mt-3 text-center text-xl font-bold text-brand-text">
              {copy.pendingReviewTitle}
            </Text>
            <Text className="mt-2 text-center text-sm leading-relaxed text-brand-muted">
              {copy.pendingReviewMessage}
            </Text>
            <Pressable
              onPress={handleClosePending}
              className="mt-6 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
              <Text className="font-bold text-white">{copy.done}</Text>
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
