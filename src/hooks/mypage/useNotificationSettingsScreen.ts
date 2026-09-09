import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { useNotificationSettingsStore } from '../../stores';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'NotificationSettings'>;

export function useNotificationSettingsScreen(navigation: Navigation) {
  const copy = useCopy('notificationSettings');
  const accessToken = useAuthStore(selectReusableAccessToken);
  const enabled = useNotificationSettingsStore(state => state.enabled);
  const eventMission = useNotificationSettingsStore(state => state.eventMission);
  const eventReview = useNotificationSettingsStore(state => state.eventReview);
  const zoneChat = useNotificationSettingsStore(state => state.zoneChat);
  const hydrated = useNotificationSettingsStore(state => state._hasHydrated);
  const setEnabled = useNotificationSettingsStore(state => state.setEnabled);
  const setPreference = useNotificationSettingsStore(state => state.setPreference);

  return {
    copy,
    isAuthenticated: Boolean(accessToken),
    hydrated,
    enabled,
    eventMission,
    eventReview,
    zoneChat,
    setEnabled,
    setPreference,
    goBack: () => navigation.goBack(),
    goLogin: () => navigation.navigate('Login'),
  };
}
