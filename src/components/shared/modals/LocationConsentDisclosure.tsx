import { Modal, Pressable, Text, View } from 'react-native';

import { appModalStyles } from './appModalStyles';
import { TEST_ID } from '../../../constants/e2e/testIds';

export type LocationConsentDisclosureProps = {
  visible: boolean;
  title: string;
  disclosure: string;
  detail: string;
  acceptLabel: string;
  declineLabel: string;
  onAccept: () => void;
  onDecline: () => void;
};

/**
 * Google Play Prominent Disclosure — 런타임 위치 권한 요청 직전에 표시.
 * 백드롭만으로는 닫히지 않으며, 동의/거절을 명시적으로 선택해야 합니다.
 */
export function LocationConsentDisclosure({
  visible,
  title,
  disclosure,
  detail,
  acceptLabel,
  declineLabel,
  onAccept,
  onDecline,
}: LocationConsentDisclosureProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onDecline}>
      <View style={appModalStyles.overlayCenter}>
        <View style={appModalStyles.backdrop} pointerEvents="none" />

        <View testID={TEST_ID.location.disclosure} style={appModalStyles.alertCard}>
          <Text className="text-center text-lg font-bold text-brand-text">
            {title}
          </Text>
          <Text className="mt-3 text-center text-sm font-semibold leading-6 text-brand-text">
            {disclosure}
          </Text>
          <Text className="mt-3 text-center text-sm leading-6 text-brand-muted">
            {detail}
          </Text>

          <View className="mt-5 gap-2">
            <Pressable
              onPress={onAccept}
              testID={TEST_ID.location.accept}
              className="items-center rounded-2xl bg-brand-primary py-3.5 active:opacity-90"
              accessibilityRole="button">
              <Text className="text-[15px] font-bold text-white">{acceptLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onDecline}
              testID={TEST_ID.location.decline}
              className="items-center py-2.5 active:opacity-80"
              accessibilityRole="button">
              <Text className="text-sm font-semibold text-brand-muted">
                {declineLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
