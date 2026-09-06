import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BrandIcon } from '../components/shared/brand/BrandIcon';
import { layout } from '../constants/common/layout';
import { TEST_ID } from '../constants/e2e/testIds';
import { useSetupPhase } from '../hooks/useSetupPhase';
import { FestivalCalendarScreen } from '../screens/festival/FestivalCalendarScreen';
import { FestivalDetailScreen } from '../screens/festival/FestivalDetailScreen';
import { PlaceMapSearchScreen } from '../screens/places/PlaceMapSearchScreen';
import { HelpDeskChatScreen } from '../screens/helpdesk/HelpDeskChatScreen';
import { EventZoneScreen } from '../screens/eventZone/EventZoneScreen';
import { EventZoneChatScreen } from '../screens/eventZone/EventZoneChatScreen';
import { EventGameDetailScreen } from '../screens/eventZone/EventGameDetailScreen';
import { EventGameCameraScreen } from '../screens/eventZone/EventGameCameraScreen';
import { EventParticipationHistoryScreen } from '../screens/eventZone/EventParticipationHistoryScreen';
import { EventAlbumScreen } from '../screens/eventZone/EventAlbumScreen';
import { EventTitlesScreen } from '../screens/eventZone/EventTitlesScreen';
import { LuggageStorageScreen } from '../screens/locker/LuggageStorageScreen';
import { TravelogueDetailScreen } from '../screens/feed/TravelogueDetailScreen';
import { MenuPlaceholderScreen } from '../screens/MenuPlaceholderScreen';
import { PlanCandidatesScreen } from '../screens/plan/PlanCandidatesScreen';
import { PlanDetailScreen } from '../screens/plan/PlanDetailScreen';
import { PlanWizardScreen } from '../screens/plan/PlanWizardScreen';
import { TravelInviteScanScreen } from '../screens/plan/TravelInviteScanScreen';
import { LanguageSelectionScreen } from '../screens/setup/LanguageSelectionScreen';
import { LoginScreen } from '../screens/setup/LoginScreen';
import { OnboardingScreen } from '../screens/setup/OnboardingScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { initI18n } from '../i18n';
import { bootstrapAuth } from '../services/auth/authSession';
import {
  hydrateAppStore,
  useAppStore,
  useAuthStore,
} from '../stores';
import type { SetupPhase } from './types';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const INITIAL_ROUTES: Record<Exclude<SetupPhase, 'main'>, keyof RootStackParamList> = {
  language: 'LanguageSelection',
  login: 'Login',
  onboarding: 'Onboarding',
};

const HYDRATE_TIMEOUT_MS = 5000;

export function RootNavigator() {
  const hasAppHydrated = useAppStore(state => state._hasHydrated);
  const hasAuthHydrated = useAuthStore(state => state._hasHydrated);
  const phase = useSetupPhase();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled && !useAppStore.getState()._hasHydrated) {
        console.warn('[Bu-Ting] Storage hydrate timeout — continuing anyway');
        useAppStore.getState().setHasHydrated(true);
      }
      if (!cancelled && !useAuthStore.getState()._hasHydrated) {
        useAuthStore.getState().setHasHydrated(true);
      }
    }, HYDRATE_TIMEOUT_MS);

    Promise.all([hydrateAppStore(), bootstrapAuth()])
      .catch(error => {
        console.warn('[Bu-Ting] startup hydrate failed', error);
        useAppStore.getState().setHasHydrated(true);
        useAuthStore.getState().setHasHydrated(true);
      })
      .finally(() => {
        if (!cancelled) {
          const language = useAppStore.getState().language ?? 'ko';
          initI18n(language);
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  if (!ready || !hasAppHydrated || !hasAuthHydrated) {
    return (
      <View testID={TEST_ID.app.loading} style={[layout.screen, styles.loading]}>
        <BrandIcon size={72} />
        <ActivityIndicator size="large" color="#0077B6" style={styles.spinner} />
      </View>
    );
  }

  const initialRoute =
    phase === 'main' ? 'MainTabs' : INITIAL_ROUTES[phase];

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, contentStyle: layout.screen }}>
        <Stack.Screen
          name="LanguageSelection"
          component={LanguageSelectionScreen}
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="MenuPlaceholder" component={MenuPlaceholderScreen} />
        <Stack.Screen name="PlanWizard" component={PlanWizardScreen} />
        <Stack.Screen name="PlanCandidates" component={PlanCandidatesScreen} />
        <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
        <Stack.Screen name="TravelInviteScan" component={TravelInviteScanScreen} />
        <Stack.Screen name="TravelRecordDetail" component={TravelogueDetailScreen} />
        <Stack.Screen name="FestivalCalendar" component={FestivalCalendarScreen} />
        <Stack.Screen name="FestivalDetail" component={FestivalDetailScreen} />
        <Stack.Screen name="LuggageStorage" component={LuggageStorageScreen} />
        <Stack.Screen name="PlaceMapSearch" component={PlaceMapSearchScreen} />
        <Stack.Screen name="HelpDeskChat" component={HelpDeskChatScreen} />
        <Stack.Screen name="EventZone" component={EventZoneScreen} />
        <Stack.Screen name="EventZoneChat" component={EventZoneChatScreen} />
        <Stack.Screen name="EventGameDetail" component={EventGameDetailScreen} />
        <Stack.Screen name="EventGameCamera" component={EventGameCameraScreen} />
        <Stack.Screen
          name="EventParticipationHistory"
          component={EventParticipationHistoryScreen}
        />
        <Stack.Screen name="EventAlbum" component={EventAlbumScreen} />
        <Stack.Screen name="EventTitles" component={EventTitlesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: 24,
  },
});
