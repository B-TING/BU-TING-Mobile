import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_MENU_ITEMS } from '../../../constants/common/appMenu';
import { TEST_ID } from '../../../constants/e2e/testIds';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../../../constants/common/alphaFeatureBlocks';
import {
  ICON_COLOR_MUTED,
  ICON_COLOR_PRIMARY,
  ICON_COLOR_WHITE,
} from '../../../constants/icons';
import { APP_MODAL, useFeatureUnavailableAlert } from '../modals';
import type { AppLanguage } from '../../../types/user';
import type { RootStackParamList } from '../../../navigation/types';
import { selectAuthUser, useAuthStore } from '../../../stores';
import { BrandLogo } from '../brand/BrandLogo';
import { AppIcon } from '../icons/AppIcon';

const headerImage = require('../../../../assets/images/drawer-busan.jpg');

const DANGER_RED = '#E11D48';
const SLIDE_DURATION = 280;
const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(320, Math.round(SCREEN_WIDTH * 0.78));

type AppMenuDrawerProps = {
  visible: boolean;
  language: AppLanguage;
  navigation: NavigationProp<RootStackParamList>;
  onClose: () => void;
};

function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'B';
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function handleFromUser(nickname: string, email: string, userId: string): string {
  const local = email.split('@')[0]?.trim();
  if (local) {
    return `@${local}`;
  }
  const slug = nickname.replace(/\s+/g, '').toLowerCase();
  if (slug) {
    return `@${slug}`;
  }
  return `@${userId.slice(0, 8)}`;
}

export function AppMenuDrawer({
  visible,
  language,
  navigation,
  onClose,
}: AppMenuDrawerProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore(selectAuthUser);
  const [mounted, setMounted] = useState(false);
  const closingRef = useRef(false);
  const slideX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const displayName = user?.nickname?.trim() || (language === 'ko' ? '게스트' : 'Guest');
  const { showUnavailable } = useFeatureUnavailableAlert();
  const handle = useMemo(() => {
    if (!user) {
      return '@guest';
    }
    return handleFromUser(user.nickname, user.email, user.userId);
  }, [user]);
  const initials = initialsFromName(displayName);

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      setMounted(true);
      slideX.setValue(-DRAWER_WIDTH);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: SLIDE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: SLIDE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideX, backdropOpacity]);

  useEffect(() => {
    if (visible || !mounted || closingRef.current) {
      return;
    }
    closingRef.current = true;
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: -DRAWER_WIDTH,
        duration: SLIDE_DURATION * 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: SLIDE_DURATION * 0.8,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      closingRef.current = false;
      if (finished) {
        setMounted(false);
      }
    });
  }, [visible, mounted, slideX, backdropOpacity]);

  const dismiss = () => {
    if (!visible) {
      return;
    }
    onClose();
  };

  const handlePress = (item: (typeof APP_MENU_ITEMS)[number]) => {
    if (item.id === 'feed' && isAlphaFeatureBlocked('feed')) {
      dismiss();
      showUnavailable(ALPHA_FEATURE_LABELS.feed);
      return;
    }
    if (item.id === 'ai' && isAlphaFeatureBlocked('helpdesk')) {
      dismiss();
      showUnavailable(ALPHA_FEATURE_LABELS.helpdesk);
      return;
    }

    dismiss();
    const { target } = item;
    if (target.kind === 'screen') {
      navigation.navigate({
        name: target.route,
        params: target.params,
      } as never);
      return;
    }
    const title = language === 'ko' ? target.titleKo : target.titleEn;
    navigation.navigate('MenuPlaceholder', { title });
  };

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}>
      <View style={styles.root}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />

        <View style={styles.row} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.drawer,
              {
                width: DRAWER_WIDTH,
                paddingBottom: Math.max(insets.bottom, 12),
                transform: [{ translateX: slideX }],
              },
            ]}
            testID={TEST_ID.menu.drawer}>
            <ImageBackground
              source={headerImage}
              style={styles.headerImage}
              imageStyle={styles.headerImageInner}>
              <View style={[styles.headerTop, { paddingTop: insets.top + 14 }]}>
                <View className="flex-row items-center justify-between px-4">
                  <BrandLogo height={22} accessibilityLabel="BU-TING" />
                  <Pressable
                    onPress={dismiss}
                    hitSlop={10}
                    testID={TEST_ID.menu.close}
                    className="h-8 w-8 items-center justify-center rounded-full active:opacity-70"
                    accessibilityRole="button"
                    accessibilityLabel={language === 'ko' ? '닫기' : 'Close'}>
                    <AppIcon name="x" size={18} color={ICON_COLOR_WHITE} strokeWidth={2.2} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.userBar}>
                <View className="flex-row items-center gap-3 px-4 py-3">
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text style={styles.userName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={styles.userHandle} numberOfLines={1}>
                      {handle}
                    </Text>
                  </View>
                </View>
              </View>
            </ImageBackground>

            <ScrollView
              className="flex-1"
              contentContainerStyle={styles.menuContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {APP_MENU_ITEMS.map(item => {
                const color = item.danger ? DANGER_RED : ICON_COLOR_PRIMARY;
                const labelColor = item.danger ? DANGER_RED : '#0F172A';
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handlePress(item)}
                    testID={TEST_ID.menu.item(item.id)}
                    className="flex-row items-center gap-3 rounded-xl px-2 py-2.5 active:bg-slate-50"
                    accessibilityRole="button">
                    <AppIcon name={item.icon} size={18} color={color} strokeWidth={1.8} />
                    <Text
                      className="flex-1 text-[13px] font-semibold"
                      style={{ color: labelColor }}>
                      {language === 'ko' ? item.labelKo : item.labelEn}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                BU-TING v1.0 · AI Busan Travel Companion
              </Text>
            </View>
          </Animated.View>

          <Pressable
            style={styles.outsideHit}
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel={language === 'ko' ? '메뉴 닫기' : 'Close menu'}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: APP_MODAL.backdropColor,
  },
  outsideHit: {
    flex: 1,
  },
  drawer: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    justifyContent: 'space-between',
    minHeight: 210,
  },
  headerImageInner: {
    resizeMode: 'cover',
  },
  headerTop: {
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  userBar: {
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: ICON_COLOR_WHITE,
    fontSize: 15,
    fontWeight: '700',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  userHandle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '500',
  },
  menuContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'center',
  },
  footerText: {
    color: ICON_COLOR_MUTED,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
