import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ImportPlanModalPhase, ImportPlanModalProps } from '../../components/feed/modals/ImportPlanModal';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../../constants/common/alphaFeatureBlocks';
import { dayCountBetween, isValidIsoDate } from '../../constants/plan/planWizard';
import type { CopyFor } from '../../i18n';
import { useFeatureUnavailableAlert } from '../../components/shared/modals';
import { navigateToMainTab } from '../../navigation/navigateToMainTab';
import type { RootStackParamList } from '../../navigation/types';
import { cloneTravelFromRecord } from '../../services/travel/cloneTravelFromRecord';
import {
  createTravelRecordComment,
  deleteTravelRecordComment,
  fetchTravelRecordComments,
  likeTravelRecord,
  unlikeTravelRecord,
  updateTravelRecordComment,
} from '../../services/travel/travelRecordService';
import {
  selectActivePlan,
  useAppStore,
  useAuthStore,
  usePlanStore,
} from '../../stores';
import { useTravelRecordBookmarkStore } from '../../stores/useTravelRecordBookmarkStore';
import {
  selectAuthUser,
  selectReusableAccessToken,
} from '../../stores/useAuthStore';
import type {
  TravelRecord,
  TravelRecordComment,
  TravelRecordSocial,
} from '../../types/travelReview';
import type { AppLanguage } from '../../types/user';
import { resolveTravelRecordDays } from '../../utils/review/travelReview';
import type { NavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Copy = CopyFor<'travelReview'>;

type TravelRecordNavigation =
  | NavigationProp<RootStackParamList>
  | NativeStackNavigationProp<RootStackParamList>;

export class TravelogueSocialError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TravelogueSocialError';
  }
}

export function useTravelogueSocialActions(
  travelRecord: TravelRecord,
  copy: Copy,
  navigation: TravelRecordNavigation,
  options?: {
    onTravelRecordPatch?: (patch: Partial<TravelRecord>) => void;
  },
) {
  const language = useAppStore(s => s.language) ?? 'ko';
  const { showUnavailable } = useFeatureUnavailableAlert();
  const accessToken = useAuthStore(selectReusableAccessToken);
  const authUser = useAuthStore(selectAuthUser);
  const userId = authUser?.userId ?? '';
  const userName =
    authUser?.nickname?.trim() ||
    (language === 'ko' ? '여행자' : 'Traveler');

  const onPatchRef = useRef(options?.onTravelRecordPatch);
  onPatchRef.current = options?.onTravelRecordPatch;

  const [comments, setComments] = useState<TravelRecordComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(travelRecord.likeCount);
  const [likedByMe, setLikedByMe] = useState(Boolean(travelRecord.likedByMe));
  const [liking, setLiking] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [commenting, setCommenting] = useState(false);

  const bookmarkedByMe = useTravelRecordBookmarkStore(state =>
    state.isBookmarked(travelRecord.travelRecordId),
  );
  const hydrateBookmarks = useTravelRecordBookmarkStore(state => state.hydrate);
  const toggleBookmarkInStore = useTravelRecordBookmarkStore(
    state => state.toggleBookmark,
  );

  useEffect(() => {
    void hydrateBookmarks(accessToken);
  }, [accessToken, hydrateBookmarks]);

  useEffect(() => {
    setLikeCount(travelRecord.likeCount);
    setLikedByMe(Boolean(travelRecord.likedByMe));
  }, [travelRecord.likeCount, travelRecord.likedByMe, travelRecord.travelRecordId]);

  const reloadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const list = await fetchTravelRecordComments(travelRecord.travelRecordId);
      setComments(list);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [travelRecord.travelRecordId]);

  useEffect(() => {
    let cancelled = false;
    setCommentsLoading(true);
    void fetchTravelRecordComments(travelRecord.travelRecordId)
      .then(list => {
        if (!cancelled) {
          setComments(list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setComments([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCommentsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [travelRecord.travelRecordId]);

  const social: TravelRecordSocial = useMemo(
    () => ({
      likedUserIds: likedByMe && userId ? [userId] : [],
      comments,
      likeCount,
      likedByMe,
    }),
    [likedByMe, userId, comments, likeCount],
  );

  const addPlan = usePlanStore(s => s.addPlan);
  const activePlan = usePlanStore(selectActivePlan);

  const [importModalPhase, setImportModalPhase] = useState<ImportPlanModalPhase | null>(null);
  const [importedPlanId, setImportedPlanId] = useState<string | null>(null);
  const [importStartDate, setImportStartDate] = useState('');
  const [importPlanTitle, setImportPlanTitle] = useState('');
  const [importing, setImporting] = useState(false);
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null);

  /**
   * 상세는 `days`로 일수 계산. 피드/북마크 목록은 days=[] 이므로
   * travelStartDate~travelEndDate로 폴백한다. (clone API는 서버 스냅샷 사용)
   */
  const importDayCount = useMemo(() => {
    const days = resolveTravelRecordDays(travelRecord, null);
    if (days.length > 0) {
      return Math.max(...days.map(d => d.dayNumber), days.length);
    }
    const start = travelRecord.travelStartDate;
    const end = travelRecord.travelEndDate;
    if (start && end && isValidIsoDate(start) && isValidIsoDate(end)) {
      return dayCountBetween(start, end);
    }
    // 목록에 기간·일차가 없어도 서버에 일정이 있을 수 있음 → 가져오기 허용
    return 1;
  }, [travelRecord]);

  const importStartDateValid = isValidIsoDate(importStartDate);

  const importComputedEndDate = useMemo(() => {
    if (!importStartDateValid || importDayCount < 1) {
      return null;
    }
    const start = new Date(`${importStartDate}T12:00:00`);
    start.setDate(start.getDate() + (importDayCount - 1));
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, '0');
    const d = String(start.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [importStartDate, importStartDateValid, importDayCount]);

  const defaultImportStartDate = useCallback(() => {
    const start = new Date();
    start.setDate(start.getDate() + 7);
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, '0');
    const d = String(start.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const closeImportModal = useCallback(() => {
    if (importing) {
      return;
    }
    setImportModalPhase(null);
    setImportedPlanId(null);
    setImportStartDate('');
    setImportPlanTitle('');
    setImportErrorMessage(null);
  }, [importing]);

  const performImport = useCallback(async () => {
    if (importing) {
      return;
    }
    if (!importStartDateValid) {
      return;
    }
    if (!accessToken?.trim() || !userId) {
      setImportErrorMessage(copy.socialLoginRequired);
      setImportModalPhase('error');
      return;
    }

    setImporting(true);
    setImportErrorMessage(null);
    try {
      const title = importPlanTitle.trim();
      const plan = await cloneTravelFromRecord({
        accessToken,
        travelRecordId: travelRecord.travelRecordId,
        members: [
          {
            userId,
            nickname: userName,
            role: 'LEADER',
          },
        ],
        request: {
          startDate: importStartDate,
          title: title.length > 0 ? title : null,
        },
      });
      addPlan(plan);
      setImportedPlanId(plan.planId);
      setImportModalPhase('success');
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : copy.importPlanFailed;
      setImportErrorMessage(message);
      setImportModalPhase('error');
    } finally {
      setImporting(false);
    }
  }, [
    importing,
    importStartDateValid,
    accessToken,
    userId,
    userName,
    importPlanTitle,
    importStartDate,
    travelRecord.travelRecordId,
    addPlan,
    copy.socialLoginRequired,
    copy.importPlanFailed,
  ]);

  const beginImportAfterDate = useCallback(() => {
    if (!importStartDateValid || importing) {
      return;
    }
    if (activePlan && activePlan.status !== 'COMPLETED') {
      setImportModalPhase('activePlanWarning');
      return;
    }
    void performImport();
  }, [importStartDateValid, importing, activePlan, performImport]);

  const requireLogin = useCallback(() => {
    throw new TravelogueSocialError(copy.socialLoginRequired);
  }, [copy.socialLoginRequired]);

  const handleToggleLike = useCallback(async () => {
    if (!accessToken?.trim() || !userId) {
      requireLogin();
      return;
    }
    if (liking) {
      return;
    }
    const nextLiked = !likedByMe;
    const prevCount = likeCount;
    const prevLiked = likedByMe;
    const optimisticCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));
    setLikedByMe(nextLiked);
    setLikeCount(optimisticCount);
    setLiking(true);
    try {
      let nextCount = optimisticCount;
      if (nextLiked) {
        const res = await likeTravelRecord(accessToken, travelRecord.travelRecordId);
        if (typeof res.likeCount === 'number') {
          nextCount = res.likeCount;
          setLikeCount(res.likeCount);
        }
      } else {
        await unlikeTravelRecord(accessToken, travelRecord.travelRecordId);
      }
      onPatchRef.current?.({
        likedByMe: nextLiked,
        likeCount: nextCount,
      });
    } catch (error) {
      setLikedByMe(prevLiked);
      setLikeCount(prevCount);
      const message =
        error instanceof Error && error.message
          ? error.message
          : copy.socialLikeFailed;
      throw new TravelogueSocialError(message);
    } finally {
      setLiking(false);
    }
  }, [
    accessToken,
    userId,
    liking,
    likedByMe,
    likeCount,
    travelRecord.travelRecordId,
    requireLogin,
    copy.socialLikeFailed,
  ]);

  const handleAddComment = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content) {
        return;
      }
      if (!accessToken?.trim() || !userId) {
        requireLogin();
        return;
      }
      if (commenting) {
        return;
      }
      const tempId = `temp-cmt-${Date.now()}`;
      const optimistic: TravelRecordComment = {
        commentId: tempId,
        travelRecordId: travelRecord.travelRecordId,
        authorId: userId,
        authorNickname: userName,
        authorProfileImageUrl: null,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setComments(prev => [...prev, optimistic]);
      setCommenting(true);
      try {
        const created = await createTravelRecordComment(
          accessToken,
          travelRecord.travelRecordId,
          { content },
        );
        setComments(prev =>
          prev.map(c => (c.commentId === tempId ? created : c)),
        );
      } catch (error) {
        setComments(prev => prev.filter(c => c.commentId !== tempId));
        const message =
          error instanceof Error && error.message
            ? error.message
            : copy.socialCommentFailed;
        throw new TravelogueSocialError(message);
      } finally {
        setCommenting(false);
      }
    },
    [
      accessToken,
      userId,
      userName,
      commenting,
      travelRecord.travelRecordId,
      requireLogin,
      copy.socialCommentFailed,
    ],
  );

  const handleUpdateComment = useCallback(
    async (commentId: string, text: string) => {
      const content = text.trim();
      if (!content) {
        return;
      }
      if (!accessToken?.trim() || !userId) {
        requireLogin();
        return;
      }
      if (commentId.startsWith('temp-cmt-')) {
        throw new TravelogueSocialError(copy.socialCommentUpdateFailed);
      }
      if (commenting) {
        return;
      }
      const prev = comments.find(c => c.commentId === commentId);
      if (!prev) {
        return;
      }
      setComments(list =>
        list.map(c =>
          c.commentId === commentId
            ? { ...c, content, updatedAt: new Date().toISOString() }
            : c,
        ),
      );
      setCommenting(true);
      try {
        const updated = await updateTravelRecordComment(
          accessToken,
          travelRecord.travelRecordId,
          commentId,
          { content },
        );
        setComments(list =>
          list.map(c => (c.commentId === commentId ? updated : c)),
        );
      } catch (error) {
        setComments(list =>
          list.map(c => (c.commentId === commentId ? prev : c)),
        );
        const message =
          error instanceof Error && error.message
            ? error.message
            : copy.socialCommentUpdateFailed;
        throw new TravelogueSocialError(message);
      } finally {
        setCommenting(false);
      }
    },
    [
      accessToken,
      userId,
      commenting,
      comments,
      travelRecord.travelRecordId,
      requireLogin,
      copy.socialCommentUpdateFailed,
    ],
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!accessToken?.trim() || !userId) {
        requireLogin();
        return;
      }
      if (commentId.startsWith('temp-cmt-')) {
        setComments(list => list.filter(c => c.commentId !== commentId));
        return;
      }
      if (commenting) {
        return;
      }
      const prev = comments;
      setComments(list => list.filter(c => c.commentId !== commentId));
      setCommenting(true);
      try {
        await deleteTravelRecordComment(
          accessToken,
          travelRecord.travelRecordId,
          commentId,
        );
      } catch (error) {
        setComments(prev);
        const message =
          error instanceof Error && error.message
            ? error.message
            : copy.socialCommentDeleteFailed;
        throw new TravelogueSocialError(message);
      } finally {
        setCommenting(false);
      }
    },
    [
      accessToken,
      userId,
      commenting,
      comments,
      travelRecord.travelRecordId,
      requireLogin,
      copy.socialCommentDeleteFailed,
    ],
  );

  const handleToggleBookmark = useCallback(async () => {
    if (!accessToken?.trim() || !userId) {
      requireLogin();
      return;
    }
    if (bookmarking) {
      return;
    }
    setBookmarking(true);
    try {
      const nextBookmarked = await toggleBookmarkInStore(
        accessToken,
        travelRecord.travelRecordId,
      );
      onPatchRef.current?.({ bookmarkedByMe: nextBookmarked });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : copy.socialBookmarkFailed;
      throw new TravelogueSocialError(message);
    } finally {
      setBookmarking(false);
    }
  }, [
    accessToken,
    userId,
    bookmarking,
    travelRecord.travelRecordId,
    toggleBookmarkInStore,
    requireLogin,
    copy.socialBookmarkFailed,
  ]);

  const handleImportPlan = () => {
    if (isAlphaFeatureBlocked('importPlan')) {
      showUnavailable(ALPHA_FEATURE_LABELS.importPlan);
      return;
    }
    // 피드 아이템은 days가 비어 있어도 travelRecordId만으로 서버 clone 가능.
    // 실제 일정 없음은 API 에러로 처리한다.
    setImportErrorMessage(null);
    setImportPlanTitle((travelRecord.title ?? '').slice(0, 15));
    setImportStartDate(defaultImportStartDate());
    setImportModalPhase('confirm');
  };

  const handleConfirmImport = () => {
    setImportModalPhase('datePick');
  };

  const handleConfirmDate = () => {
    beginImportAfterDate();
  };

  const handleConfirmActivePlanImport = () => {
    void performImport();
  };

  const handleGoToImportedPlan = () => {
    if (!importedPlanId) {
      return;
    }
    closeImportModal();
    // 스택 PlanDetail이 아니라 메인 탭의 일정(route)으로 전환
    navigateToMainTab(navigation, 'route');
  };

  const importModalProps: ImportPlanModalProps = {
    phase: importModalPhase,
    copy,
    language: language as AppLanguage,
    travelRecordTitle: travelRecord.title ?? '',
    activePlanTitle: activePlan?.title,
    dayCount: importDayCount,
    startDate: importStartDate,
    planTitle: importPlanTitle,
    computedEndDate: importComputedEndDate,
    startDateValid: importStartDateValid,
    importing,
    errorMessage: importErrorMessage,
    onChangeStartDate: setImportStartDate,
    onChangePlanTitle: setImportPlanTitle,
    onClose: closeImportModal,
    onConfirm: handleConfirmImport,
    onConfirmDate: handleConfirmDate,
    onConfirmActivePlan: handleConfirmActivePlanImport,
    onGoToPlan: handleGoToImportedPlan,
  };

  return {
    travelRecord,
    social,
    userId,
    userName,
    commentsLoading,
    commenting,
    liking,
    bookmarking,
    bookmarkedByMe,
    reloadComments,
    handleToggleLike,
    handleToggleBookmark,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleImportPlan,
    importModalProps,
    travelogue: travelRecord,
    handleToggleHelpful: handleToggleLike,
  };
}
