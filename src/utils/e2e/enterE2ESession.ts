import { LogBox } from 'react-native';

import { TEST_ID } from '../../constants/e2e/testIds';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import type { OnboardingProfile } from '../../types/user';

export const E2E_USER_ID = 'e2e-qa-user';
export const E2E_ACCESS_TOKEN = 'e2e-local-token';

const E2E_PROFILE: OnboardingProfile = {
  travelStyle: 'planned',
  schedulePace: 'relaxed',
  companions: 'solo',
  luggage: 'light',
  purposes: ['food'],
  busanFamiliarity: 'novice',
  skippedSteps: [],
  skippedAll: false,
  completedAt: '2026-01-01T00:00:00.000Z',
  language: 'ko',
  aiPromptContext: '',
};

/**
 * QA E2E 전용 로컬 세션. 릴리스 빌드에서는 동작하지 않습니다.
 * OAuth 없이 메인 탭·탐색 스모크를 돌리기 위한 진입점입니다.
 */
export function enterE2ESession(): boolean {
  if (!__DEV__) {
    return false;
  }

  // 가짜 토큰 401 LogBox가 FAB·탭·다음 버튼을 가린다
  LogBox.ignoreAllLogs(true);

  const app = useAppStore.getState();
  if (!app.language) {
    app.setLanguage('ko');
  }

  if (!useAppStore.getState().onboarding) {
    useAppStore.getState().completeOnboarding(
      {
        ...E2E_PROFILE,
        language: useAppStore.getState().language ?? 'ko',
        completedAt: new Date().toISOString(),
      },
      { userId: E2E_USER_ID },
    );
  }

  useAuthStore.getState().setSession({
    accessToken: E2E_ACCESS_TOKEN,
    expiresIn: 60 * 60 * 24 * 365,
    user: {
      userId: E2E_USER_ID,
      email: 'e2e@buting.test',
      nickname: 'E2E',
      provider: 'google',
    },
    rememberMe: true,
    provider: 'google',
    providerToken: null,
  });

  useAppStore.getState().login({
    userId: E2E_USER_ID,
    displayName: 'E2E',
  });

  return true;
}
