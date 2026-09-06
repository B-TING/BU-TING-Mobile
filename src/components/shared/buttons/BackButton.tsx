import { Pressable } from 'react-native';

import { TEST_ID } from '../../../constants/e2e/testIds';
import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { AppIcon } from '../icons/AppIcon';

type BackButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

export function BackButton({
  onPress,
  accessibilityLabel = 'Go back',
  testID = TEST_ID.nav.back,
}: BackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      testID={testID}
      className="mr-2 h-10 w-10 items-center justify-center rounded-lg active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <AppIcon name="arrowLeft" size={24} color={ICON_COLOR_PRIMARY} />
    </Pressable>
  );
}
