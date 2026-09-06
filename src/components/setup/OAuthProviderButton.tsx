import { Pressable, Text, View } from 'react-native';

import { ENABLED_OAUTH_PROVIDERS } from '../../constants/auth/oauthProviders';
import type { OAuthProvider } from '../../types/auth';
import { cn } from '../../utils/common/cn';
import { GoogleSignInButton } from './GoogleSignInButton';
import { KakaoSignInButton } from './KakaoSignInButton';

type ProviderMeta = {
  label: Record<'ko' | 'en', string>;
  backgroundClass: string;
  textClass: string;
};

const PROVIDER_META: Record<OAuthProvider, ProviderMeta> = {
  google: {
    label: { ko: 'Google 계정으로 로그인', en: 'Sign in with Google' },
    backgroundClass: 'bg-white border-brand-border',
    textClass: 'text-brand-text',
  },
  kakao: {
    label: { ko: '카카오 로그인', en: 'Login with Kakao' },
    backgroundClass: 'bg-[#FEE500] border-[#FEE500]',
    textClass: 'text-[#191919]',
  },
  naver: {
    label: { ko: '네이버로 계속하기', en: 'Continue with Naver' },
    backgroundClass: 'bg-[#03C75A] border-[#03C75A]',
    textClass: 'text-white',
  },
};

type Props = {
  provider: OAuthProvider;
  language: 'ko' | 'en' | 'ja' | 'zh';
  disabled?: boolean;
  onPress: (provider: OAuthProvider) => void;
};

export function OAuthProviderButton({
  provider,
  language,
  disabled = false,
  onPress,
}: Props) {
  const meta = PROVIDER_META[provider];
  const label = language === 'ko' ? meta.label.ko : meta.label.en;

  if (provider === 'google') {
    return (
      <GoogleSignInButton
        language={language}
        disabled={disabled}
        onPress={() => onPress(provider)}
      />
    );
  }

  if (provider === 'kakao') {
    return (
      <KakaoSignInButton
        language={language}
        disabled={disabled}
        onPress={() => onPress(provider)}
      />
    );
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onPress(provider)}
      testID={`login.${provider}`}
      className={cn(
        'mb-3 rounded-xl border px-4 py-3.5 active:opacity-90',
        meta.backgroundClass,
        disabled && 'opacity-50',
      )}>
      <Text className={cn('text-center text-base font-semibold', meta.textClass)}>
        {label}
      </Text>
    </Pressable>
  );
}

type ListProps = {
  language: 'ko' | 'en' | 'ja' | 'zh';
  disabled?: boolean;
  onPress: (provider: OAuthProvider) => void;
};

export function OAuthProviderList({ language, disabled, onPress }: ListProps) {
  return (
    <View>
      {ENABLED_OAUTH_PROVIDERS.map(provider => (
        <OAuthProviderButton
          key={provider}
          provider={provider}
          language={language}
          disabled={disabled}
          onPress={onPress}
        />
      ))}
    </View>
  );
}
