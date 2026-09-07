import { useCallback, useEffect, useState } from 'react';
import type { NavigationProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

import { useAppAlert, useFeatureUnavailableAlert } from '../../components/shared/modals';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../../constants/common/alphaFeatureBlocks';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { logoutSession } from '../../services/auth/authSession';
import { countPlaceReviewsForMyTravelRecords } from '../../services/travel/loadTravelRecordDetail';
import {
  fetchMyTravelRecords,
  TravelRecordServiceError,
} from '../../services/travel/travelRecordService';
import { fetchTravelSurveyProfile } from '../../services/setup/travelSurveyService';
import {
  createEmptyOnboardingProfile,
  hasAnsweredSurvey,
} from '../../services/setup/travelSurveyMapper';
import { deleteMyAccount, updateMyProfile, UserServiceError } from '../../services/user/userService';
import { fetchMyZoneTitles } from '../../services/eventZone/zoneTitleService';
import type { EquippedTitleResponse } from '../../types/zoneTitleApi';
import {
  useAppStore,
  useAuthStore,
  useTravelRecordBookmarkStore,
} from '../../stores';
import {
  selectAuthUser,
  selectIsAuthenticated,
  selectReusableAccessToken,
} from '../../stores/useAuthStore';
import { mapTravelRecordManageItem } from '../../types/travelRecordApi';
import type { TravelRecord } from '../../types/travelReview';

type UseMyPageScreenParams = {
  navigation: NavigationProp<RootStackParamList>;
};

function profileHandle(nickname: string): string {
  const cleaned = nickname.trim().replace(/\s+/g, '').toLowerCase();
  return cleaned ? `@${cleaned}` : '@user';
}

export function useMyPageScreen({ navigation }: UseMyPageScreenParams) {
  const { alert } = useAppAlert();
  const { showUnavailable } = useFeatureUnavailableAlert();
  const language = useAppLanguage();
  const user = useAuthStore(selectAuthUser);
  const hideUserIdOnMyPage = useAppStore(s => s.hideUserIdOnMyPage);
  const setHideUserIdOnMyPage = useAppStore(s => s.setHideUserIdOnMyPage);
  const copy = useCopy('myPage');
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const rememberMe = useAuthStore(s => s.rememberMe);
  const accessToken = useAuthStore(selectReusableAccessToken);

  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [savingNickname, setSavingNickname] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [records, setRecords] = useState<TravelRecord[]>([]);
  const [placeReviewCount, setPlaceReviewCount] = useState(0);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recordsTab, setRecordsTab] = useState<'mine' | 'saved'>('mine');
  const [equippedTitle, setEquippedTitle] = useState<EquippedTitleResponse | null>(null);

  const bookmarkedRecords = useTravelRecordBookmarkStore(s => s.bookmarkedRecords);
  const bookmarksLoading = useTravelRecordBookmarkStore(s => s.loading);
  const hydrateBookmarks = useTravelRecordBookmarkStore(s => s.hydrate);

  const nickname = user?.nickname || user?.email?.split('@')[0] || 'User';
  const handle = profileHandle(nickname);

  const loadMyRecords = useCallback(async () => {
    if (!accessToken) {
      setRecords([]);
      setPlaceReviewCount(0);
      return;
    }
    const list = await fetchMyTravelRecords(accessToken);
    const mapped = list.map(item => mapTravelRecordManageItem(item, nickname));
    setRecords(mapped);
    const reviewCount = await countPlaceReviewsForMyTravelRecords(
      accessToken,
      list.map(item => item.travelRecordId),
    );
    setPlaceReviewCount(reviewCount);
    await hydrateBookmarks(accessToken);
  }, [accessToken, nickname, hydrateBookmarks]);

  const loadEquippedTitle = useCallback(async () => {
    if (!accessToken) {
      setEquippedTitle(null);
      return;
    }
    try {
      const mine = await fetchMyZoneTitles(accessToken);
      setEquippedTitle(mine.equipped ?? null);
    } catch {
      setEquippedTitle(null);
    }
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    setLoadingRecords(true);
    void loadMyRecords()
      .catch(error => {
        if (__DEV__) {
          const message =
            error instanceof TravelRecordServiceError ? error.message : String(error);
          console.warn('[MyPage] fetchMyTravelRecords failed:', message);
        }
        if (!cancelled) {
          setRecords([]);
          setPlaceReviewCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRecords(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadMyRecords]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadMyRecords(), loadEquippedTitle()]);
    } catch (error) {
      if (__DEV__) {
        const message =
          error instanceof TravelRecordServiceError ? error.message : String(error);
        console.warn('[MyPage] refresh failed:', message);
      }
    } finally {
      setRefreshing(false);
    }
  }, [loadMyRecords, loadEquippedTitle]);

  useFocusEffect(
    useCallback(() => {
      void loadEquippedTitle();
      if (!accessToken || !user?.userId) {
        return;
      }
      const userId = user.userId;
      let cancelled = false;
      void fetchTravelSurveyProfile(accessToken, userId, language)
        .then(profile => {
          if (cancelled) {
            return;
          }
          if (profile && hasAnsweredSurvey(profile)) {
            useAppStore.getState().saveUserOnboarding(userId, profile);
            return;
          }
          useAppStore
            .getState()
            .saveUserOnboarding(userId, createEmptyOnboardingProfile(language, userId));
        })
        .catch(error => {
          console.warn('[Bu-Ting] MyPage travel survey fetch failed', error);
        });
      return () => {
        cancelled = true;
      };
    }, [accessToken, user?.userId, language, loadEquippedTitle]),
  );

  const goToLogin = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }, [navigation]);

  const handleLogout = useCallback(() => {
    alert({
      title: copy.logout,
      message: copy.logoutConfirm,
      buttons: [
        { label: copy.logoutCancel, variant: 'secondary', onPress: () => {} },
        {
          label: copy.logout,
          variant: 'danger',
          onPress: () => {
            void logoutSession().then(goToLogin);
          },
        },
      ],
    });
  }, [alert, copy, goToLogin]);

  const applyNicknameUpdate = useCallback(
    (nextNickname: string) => {
      if (!user) {
        return;
      }
      useAuthStore.getState().setUser({ ...user, nickname: nextNickname });
      useAppStore.getState().login({
        userId: user.userId,
        displayName: nextNickname || user.email.split('@')[0] || 'User',
      });
    },
    [user],
  );

  const handleSaveNickname = useCallback(
    async (nextNickname: string) => {
      if (!accessToken) {
        alert({ title: copy.changeNicknameError });
        return;
      }
      if (!nextNickname) {
        alert({ title: copy.changeNicknameEmpty });
        return;
      }

      setSavingNickname(true);
      try {
        const updated = await updateMyProfile(accessToken, { nickname: nextNickname });
        applyNicknameUpdate(updated.nickname);
        setNicknameModalOpen(false);
        alert({ title: copy.changeNicknameSuccess });
      } catch (error) {
        const message =
          error instanceof UserServiceError && error.message
            ? error.message
            : copy.changeNicknameError;
        alert({ title: message });
      } finally {
        setSavingNickname(false);
      }
    },
    [accessToken, alert, applyNicknameUpdate, copy],
  );

  const handleDeleteAccount = useCallback(() => {
    if (!accessToken || deletingAccount) {
      return;
    }

    alert({
      title: copy.deleteAccount,
      message: copy.deleteAccountConfirm,
      buttons: [
        { label: copy.deleteAccountCancel, variant: 'secondary', onPress: () => {} },
        {
          label: copy.deleteAccount,
          variant: 'danger',
          onPress: () => {
            setDeletingAccount(true);
            void deleteMyAccount(accessToken)
              .then(() => logoutSession())
              .then(goToLogin)
              .catch(error => {
                const message =
                  error instanceof UserServiceError && error.message
                    ? error.message
                    : copy.deleteAccountError;
                alert({ title: message });
              })
              .finally(() => setDeletingAccount(false));
          },
        },
      ],
    });
  }, [accessToken, alert, copy, deletingAccount, goToLogin]);

  const handlePressRecord = useCallback(
    (travelRecordId: string) => {
      if (isAlphaFeatureBlocked('travelogue')) {
        showUnavailable(ALPHA_FEATURE_LABELS.travelogue);
        return;
      }
      navigation.navigate('TravelRecordDetail', { travelRecordId });
    },
    [navigation, showUnavailable],
  );

  const handleNotificationSettings = useCallback(() => {
    alert({ title: copy.notificationUnavailable });
  }, [alert, copy.notificationUnavailable]);

  const providerLabel = user ? copy.providers[user.provider] : '—';

  return {
    copy,
    user,
    isAuthenticated,
    rememberMe,
    hideUserIdOnMyPage,
    setHideUserIdOnMyPage,
    nickname,
    handle,
    providerLabel,
    nicknameModalOpen,
    setNicknameModalOpen,
    accountOpen,
    setAccountOpen,
    savingNickname,
    deletingAccount,
    records,
    placeReviewCount,
    loadingRecords,
    refreshing,
    onRefresh,
    recordsTab,
    setRecordsTab,
    bookmarkedRecords,
    bookmarksLoading,
    goToLogin,
    handleLogout,
    handleSaveNickname,
    handleDeleteAccount,
    handlePressRecord,
    handleNotificationSettings,
    equippedTitle,
  };
}
