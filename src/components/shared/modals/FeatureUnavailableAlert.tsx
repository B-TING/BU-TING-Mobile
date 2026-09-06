import { Modal, Pressable, Text, View } from 'react-native';

import { appModalStyles } from './appModalStyles';
import { AppModalActions } from './AppModalActions';
import { TEST_ID } from '../../../constants/e2e/testIds';

export type FeatureUnavailableAlertProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onClose: () => void;
};

export function FeatureUnavailableAlert({
  visible,
  title,
  message,
  confirmLabel,
  onClose,
}: FeatureUnavailableAlertProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={appModalStyles.overlayCenter}>
        <Pressable
          style={appModalStyles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
        />

        <View testID={TEST_ID.alert.featureUnavailable} style={appModalStyles.alertCard}>
          <Text className="text-center text-lg font-bold text-brand-text">{title}</Text>
          <Text className="mt-2 text-center text-sm leading-6 text-brand-muted">
            {message}
          </Text>

          <AppModalActions
            className="mt-5 px-0"
            actions={[
              {
                label: confirmLabel,
                onPress: onClose,
                variant: 'primary',
                testID: TEST_ID.alert.confirm,
              },
            ]}
          />
        </View>
      </View>
    </Modal>
  );
}
