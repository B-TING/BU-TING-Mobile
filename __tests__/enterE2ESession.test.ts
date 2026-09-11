jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/i18n', () => ({
  changeAppLanguage: jest.fn(() => Promise.resolve()),
}));

import { TEST_ID } from '../src/constants/e2e/testIds';
import { e2e } from '../src/utils/e2e/e2eProps';
import { useAppStore } from '../src/stores/useAppStore';
import {
  selectIsAuthenticated,
  useAuthStore,
} from '../src/stores/useAuthStore';
import {
  E2E_ACCESS_TOKEN,
  E2E_USER_ID,
  enterE2ESession,
} from '../src/utils/e2e/enterE2ESession';

function collectStaticIds(value: unknown, acc: string[] = []): string[] {
  if (typeof value === 'string') {
    acc.push(value);
    return acc;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach(child => collectStaticIds(child, acc));
  }
  return acc;
}

describe('E2E test IDs', () => {
  it('keeps static selector ids unique', () => {
    const ids = collectStaticIds(TEST_ID);
    expect(ids.length).toBeGreaterThan(20);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('builds testID props for Maestro', () => {
    expect(e2e(TEST_ID.home.screen)).toEqual({ testID: 'home.screen' });
  });

  it('builds plan wizard step and option selectors', () => {
    expect(TEST_ID.planWizard.step('title')).toBe('planWizard.step.title');
    expect(TEST_ID.planWizard.option('companionType', 'solo')).toBe(
      'planWizard.option.companionType.solo',
    );
    expect(TEST_ID.planWizard.generationManual).toBe('planWizard.generation.manual');
  });
});

describe('enterE2ESession', () => {
  beforeEach(() => {
    useAppStore.getState().resetSetup();
    useAuthStore.getState().clearSession();
  });

  it('hydrates language, onboarding, and a local auth session in __DEV__', () => {
    expect(enterE2ESession()).toBe(true);

    expect(useAppStore.getState().language).toBe('ko');
    expect(useAppStore.getState().onboarding?.ownerUserId).toBe(E2E_USER_ID);
    expect(useAuthStore.getState().accessToken).toBe(E2E_ACCESS_TOKEN);
    expect(useAuthStore.getState().user?.nickname).toBe('E2E');
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true);
  });
});
