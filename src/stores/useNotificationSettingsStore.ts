import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** 로컬 선호만 저장. FCM / 디바이스 토큰은 연동하지 않는다. */
export type NotificationPreferenceKey = 'eventMission' | 'eventReview' | 'zoneChat';

type NotificationSettingsState = {
  enabled: boolean;
  eventMission: boolean;
  eventReview: boolean;
  zoneChat: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setEnabled: (value: boolean) => void;
  setPreference: (key: NotificationPreferenceKey, value: boolean) => void;
};

export const useNotificationSettingsStore = create<NotificationSettingsState>()(
  persist(
    set => ({
      enabled: true,
      eventMission: true,
      eventReview: true,
      zoneChat: true,
      _hasHydrated: false,
      setHasHydrated: value => set({ _hasHydrated: value }),
      setEnabled: value => set({ enabled: value }),
      setPreference: (key, value) => set({ [key]: value }),
    }),
    {
      name: '@buting/notification-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        enabled: state.enabled,
        eventMission: state.eventMission,
        eventReview: state.eventReview,
        zoneChat: state.zoneChat,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('[Bu-Ting] notification settings rehydrate error', error);
        }
        useNotificationSettingsStore.getState().setHasHydrated(true);
      },
    },
  ),
);
