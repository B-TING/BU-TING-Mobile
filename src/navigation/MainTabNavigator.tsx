import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PlanSyncStatusDot } from '../components/plan/PlanSyncStatusDot';
import { AppBar } from '../components/shared/navigation/AppBar';
import { AppMenuDrawer } from '../components/shared/navigation/AppMenuDrawer';
import { Navbar, type NavbarTab } from '../components/shared/navigation/Navbar';
import { layout } from '../constants/common/layout';
import { TEST_ID } from '../constants/e2e/testIds';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../constants/common/alphaFeatureBlocks';
import { useAppLanguage } from '../i18n';
import { useFeatureUnavailableAlert } from '../components/shared/modals';
import { MainHomeScreen } from '../screens/MainHomeScreen';
import { MyPageScreen } from '../screens/MyPageScreen';
import { PlanDetailScreen } from '../screens/plan/PlanDetailScreen';
import { TravelogueFeedScreen } from '../screens/feed/TravelogueFeedScreen';
import {
  selectActivePlan,
  selectHomeFeaturedPlan,
  selectIsPlanOfflineSync,
  usePlanStore,
} from '../stores/usePlanStore';
import { isServerBackedPlan } from '../utils/plan/serverBackedPlan';
import { MainTabNavigationContext } from './mainTabNavigation';
import { resolveItineraryPlan } from './navigateToMainTab';
import type { RootStackParamList } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

const TAB_ORDER: NavbarTab[] = ['home', 'route', 'feed', 'my'];
const SLIDE_DURATION_MS = 280;

function tabIndex(tab: NavbarTab): number {
  return TAB_ORDER.indexOf(tab);
}

function MainRouteTabPanel({
  navigation,
}: {
  navigation: NavigationProp<RootStackParamList>;
}) {
  const routePlan = usePlanStore(s => selectActivePlan(s) ?? selectHomeFeaturedPlan(s));
  const stackNavigation =
    navigation as NativeStackScreenProps<RootStackParamList, 'PlanDetail'>['navigation'];

  if (!routePlan) {
    return <View className="flex-1 bg-brand-background" />;
  }

  return (
    <PlanDetailScreen
      navigation={stackNavigation}
      route={{
        key: `main-tab-plan-${routePlan.planId}`,
        name: 'PlanDetail',
        params: { planId: routePlan.planId },
      }}
      embeddedInMainTabs
    />
  );
}

function MainTabPanel({
  tab,
  navigation,
}: {
  tab: NavbarTab;
  navigation: NavigationProp<RootStackParamList>;
}) {
  switch (tab) {
    case 'home':
      return <MainHomeScreen navigation={navigation} />;
    case 'route':
      return <MainRouteTabPanel navigation={navigation} />;
    case 'feed':
      return <TravelogueFeedScreen navigation={navigation} embeddedInMainTabs />;
    case 'my':
      return <MyPageScreen navigation={navigation} />;
    default:
      return null;
  }
}

export function MainTabNavigator({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const language = useAppLanguage();
  const { showUnavailable } = useFeatureUnavailableAlert();
  const initialTab = route.params?.tab ?? 'home';
  const safeInitialTab =
    initialTab === 'route' && !resolveItineraryPlan()
      ? 'home'
      : initialTab === 'feed' && isAlphaFeatureBlocked('feed')
        ? 'home'
        : initialTab;

  const [activeTab, setActiveTab] = useState<NavbarTab>(safeInitialTab);
  const [mountedTabs, setMountedTabs] = useState<Set<NavbarTab>>(
    () => new Set<NavbarTab>([safeInitialTab]),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [navbarHidden, setNavbarHidden] = useState(false);
  const slideX = useRef(new Animated.Value(-tabIndex(safeInitialTab) * width)).current;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const featuredPlan = usePlanStore(selectHomeFeaturedPlan);
  const showHomeSyncDot =
    activeTab === 'home' && Boolean(featuredPlan && isServerBackedPlan(featuredPlan));
  const isHomeOfflineSync = usePlanStore(
    selectIsPlanOfflineSync(featuredPlan?.planId ?? ''),
  );

  const switchToTab = useCallback(
    (tab: NavbarTab, options?: { animated?: boolean }) => {
      const nextIndex = tabIndex(tab);

      setMountedTabs(prev => {
        if (prev.has(tab)) {
          return prev;
        }
        return new Set([...prev, tab]);
      });
      setActiveTab(tab);
      activeTabRef.current = tab;

      const toValue = -nextIndex * width;
      if (options?.animated === false || width <= 0) {
        slideX.setValue(toValue);
        return;
      }

      Animated.timing(slideX, {
        toValue,
        duration: SLIDE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [slideX, width],
  );

  const goToTab = useCallback(
    (tab: NavbarTab) => {
      if (tab === activeTabRef.current) {
        return;
      }

      if (tab === 'feed' && isAlphaFeatureBlocked('feed')) {
        showUnavailable(ALPHA_FEATURE_LABELS.feed);
        return;
      }

      if (tab === 'route' && !resolveItineraryPlan()) {
        navigation.navigate('PlanWizard');
        return;
      }

      navigation.setParams({ tab });
      switchToTab(tab);
    },
    [navigation, showUnavailable, switchToTab],
  );

  useEffect(() => {
    switchToTab(activeTabRef.current, { animated: false });
  }, [switchToTab, width]);

  useEffect(() => {
    const tab = route.params?.tab;
    if (!tab || tab === activeTabRef.current) {
      return;
    }

    if (tab === 'feed' && isAlphaFeatureBlocked('feed')) {
      navigation.setParams({ tab: activeTabRef.current });
      showUnavailable(ALPHA_FEATURE_LABELS.feed);
      return;
    }

    if (tab === 'route' && !resolveItineraryPlan()) {
      navigation.setParams({ tab: activeTabRef.current });
      navigation.navigate('PlanWizard');
      return;
    }

    switchToTab(tab);
  }, [navigation, route.params?.tab, showUnavailable, switchToTab]);

  const contextValue = useMemo(
    () => ({
      activeTab,
      goToTab,
      navbarHidden,
      setNavbarHidden,
    }),
    [activeTab, goToTab, navbarHidden],
  );

  return (
    <MainTabNavigationContext.Provider value={contextValue}>
      <View testID={TEST_ID.main.screen} className="flex-1 bg-brand-background" style={layout.screen}>
        <AppBar
          onMenuPress={() => setMenuOpen(true)}
          onProfilePress={() => goToTab('my')}
          topRightAccessory={
            showHomeSyncDot ? <PlanSyncStatusDot offline={isHomeOfflineSync} /> : undefined
          }
        />

        <AppMenuDrawer
          visible={menuOpen}
          language={language}
          navigation={navigation}
          onClose={() => setMenuOpen(false)}
        />

        <View className="flex-1 overflow-hidden">
          <Animated.View
            style={{
              flexDirection: 'row',
              width: width * TAB_ORDER.length,
              height: '100%',
              transform: [{ translateX: slideX }],
            }}>
            {TAB_ORDER.map(tab => (
              <View key={tab} style={{ width, height: '100%' }}>
                {mountedTabs.has(tab) ? (
                  <MainTabPanel tab={tab} navigation={navigation} />
                ) : null}
              </View>
            ))}
          </Animated.View>
        </View>

        {navbarHidden ? null : (
          <Navbar activeTab={activeTab} language={language} onTabPress={goToTab} />
        )}
      </View>
    </MainTabNavigationContext.Provider>
  );
}
