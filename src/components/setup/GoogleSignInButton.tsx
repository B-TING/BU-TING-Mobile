import { Pressable, Text, View } from 'react-native';

import {
  getGoogleLoginLabel,
  GOOGLE_BUTTON,
  OAUTH_BUTTON_HEIGHT,
} from '../../constants/auth/oauthButtonStyle';
import { TEST_ID } from '../../constants/e2e/testIds';
import type { AppLanguage } from '../../types/user';
import { cn } from '../../utils/common/cn';
import { GoogleGIcon } from './icons/GoogleGIcon';

type Props = {
  language: AppLanguage;
  disabled?: boolean;
  onPress: () => void;
};

/** Google Identity Services material button */
export function GoogleSignInButton({ language, disabled = false, onPress }: Props) {
  const label = getGoogleLoginLabel(language);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={TEST_ID.login.google}
      className={cn('mb-3 w-full active:opacity-90', disabled && 'opacity-50')}>
      <View
        style={{
          width: '100%',
          height: OAUTH_BUTTON_HEIGHT,
          borderRadius: GOOGLE_BUTTON.borderRadius,
          backgroundColor: GOOGLE_BUTTON.container,
          borderWidth: 1,
          borderColor: GOOGLE_BUTTON.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 12,
        }}>
        <GoogleGIcon size={GOOGLE_BUTTON.iconSize} />
        <Text
          style={{
            marginLeft: GOOGLE_BUTTON.iconGap,
            fontSize: GOOGLE_BUTTON.fontSize,
            fontWeight: '500',
            color: GOOGLE_BUTTON.label,
          }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
