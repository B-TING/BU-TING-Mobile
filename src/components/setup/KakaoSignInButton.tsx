import { Pressable, Text, View } from 'react-native';

import {
  getKakaoLoginLabel,
  KAKAO_BUTTON,
  OAUTH_BUTTON_HEIGHT,
} from '../../constants/auth/oauthButtonStyle';
import { TEST_ID } from '../../constants/e2e/testIds';
import type { AppLanguage } from '../../types/user';
import { cn } from '../../utils/common/cn';
import { KakaoSymbolIcon } from './icons/KakaoSymbolIcon';

type Props = {
  language: AppLanguage;
  disabled?: boolean;
  onPress: () => void;
};

/** 카카오 로그인 공식 버튼 가이드 */
export function KakaoSignInButton({ language, disabled = false, onPress }: Props) {
  const label = getKakaoLoginLabel(language);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={TEST_ID.login.kakao}
      className={cn('mb-3 w-full active:opacity-90', disabled && 'opacity-50')}>
      <View
        style={{
          width: '100%',
          height: OAUTH_BUTTON_HEIGHT,
          borderRadius: KAKAO_BUTTON.borderRadius,
          backgroundColor: KAKAO_BUTTON.container,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
        }}>
        <KakaoSymbolIcon size={KAKAO_BUTTON.iconSize} color={KAKAO_BUTTON.symbol} />
        <Text
          style={{
            marginLeft: KAKAO_BUTTON.iconGap,
            fontSize: KAKAO_BUTTON.fontSize,
            fontWeight: '400',
            color: KAKAO_BUTTON.label,
          }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
