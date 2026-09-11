import type { AppLanguage } from '../../types/user';

export const REVIEW_TAG_PRESETS: Record<AppLanguage, string[]> = {
  ko: ['맛집', '뷰맛집', '사진스팟', '힐링', '가족', '데이트', '재방문', '추천'],
  en: ['food', 'view', 'photo spot', 'relaxing', 'family', 'date', 'revisit', 'recommend'],
  ja: ['グルメ', '絶景', '写真スポット', '癒し', '家族', 'デート', '再訪', 'おすすめ'],
  zh: ['美食', '风景', '拍照', '放松', '家庭', '约会', '再访', '推荐'],
};

/** @deprecated Use useCopy('travelReview') from src/i18n */
export const TRAVEL_REVIEW_COPY: Record<
  AppLanguage,
  {
    writeReview: string;
    editReview: string;
    deleteReview: string;
    deleteReviewConfirmTitle: string;
    deleteReviewConfirmMessage: string;
    deleteReviewConfirm: string;
    reviewTitle: string;
    placeLabel: string;
    ratingLabel: string;
    tagsLabel: string;
    tagPlaceholder: string;
    commentLabel: string;
    commentPlaceholder: string;
    mediaLabel: string;
    addPhoto: string;
    addVideo: string;
    chooseFromLibrary: string;
    takePhoto: string;
    takeVideo: string;
    mediaHint: string;
    mediaPermissionDenied: string;
    mediaPermissionTitle: string;
    mediaPermissionLibraryDisclosure: string;
    mediaPermissionCameraDisclosure: string;
    mediaPermissionDetail: string;
    mediaPermissionAllow: string;
    mediaPermissionDeny: string;
    mediaPermissionOpenSettings: string;
    mediaPickFailed: string;
    mediaUploadFailed: string;
    mediaLimitReached: string;
    unsupportedVideoFormat: string;
    unsupportedImageFormat: string;
    fileTooLarge: string;
    save: string;
    cancel: string;
    recordsTitle: string;
    recordsSub: string;
    progress: (done: number, total: number) => string;
    noReviewsYet: string;
    allReviewsDone: string;
    composeTravelogue: string;
    editTravelogue: string;
    composeTitle: string;
    composeSub: string;
    editTravelogueTitle: string;
    editTravelogueSub: string;
    travelogueTitle: string;
    travelogueTitlePlaceholder: string;
    overallRating: string;
    overallRatingHint: string;
    overallReview: string;
    overallReviewPlaceholder: string;
    authorLabel: string;
    visibilityLabel: string;
    visibilityPublic: string;
    visibilityPrivate: string;
    visibilityPublicHint: string;
    visibilityPrivateHint: string;
    coverImageLabel: string;
    coverImageHint: string;
    coverImageAuto: string;
    publish: string;
    saveTravelogue: string;
    published: string;
    publishedPublic: string;
    publishedPrivate: string;
    viewFeed: string;
    viewMyTravelogue: string;
    publishedSuccessPublic: string;
    publishedSuccessPrivate: string;
    updatedSuccessPublic: string;
    updatedSuccessPrivate: string;
    feedTitle: string;
    feedEmpty: string;
    feedEmptySub: string;
    placeReviewsSection: string;
    stars: (n: number) => string;
    visitFirst: string;
    publishedSuccess: string;
    completeTrip: string;
    completeTripConfirmTitle: string;
    completeTripConfirmMessage: string;
    completeTripConfirm: string;
    composePartialHint: string;
    detailBy: (name: string) => string;
    overallSummary: string;
    itinerarySection: string;
    tripEndedSuccess: string;
    noReviewForPlace: string;
    dayLabel: (n: number) => string;
    visitedBadge: string;
    notVisitedBadge: string;
    mapTitle: string;
    mapSubtitle: string;
    tripPeriod: (start: string, end: string) => string;
    totalDuration: (duration: string) => string;
    helpfulLabel: string;
    helpfulCount: (n: number) => string;
    importPlan: string;
    importPlanConfirmTitle: string;
    importPlanConfirmMessage: (title: string) => string;
    importPlanDateTitle: string;
    importPlanDateMessage: (dayCount: number) => string;
    importPlanTitleLabel: string;
    importPlanTitlePlaceholder: string;
    importPlanStartDateLabel: string;
    importPlanEndDateLabel: string;
    importPlanEndDateHint: string;
    importPlanDayCountLabel: string;
    importPlanDayCount: (n: number) => string;
    importPlanInvalidDate: string;
    importPlanImporting: string;
    importPlanFailed: string;
    importPlanSuccess: string;
    importPlanSuccessSub: string;
    importPlanGo: string;
    importPlanClose: string;
    importPlanNoItinerary: string;
    tripPeriodLabel: string;
    importPlanActivePlanTitle: string;
    importPlanActivePlanMessage: (title: string) => string;
    importPlanActivePlanConfirm: string;
    activePlanLabel: string;
    feedCommentsTitle: string;
    feedCommentPlaceholder: string;
    feedCommentsEmpty: string;
    feedAddComment: string;
    feedEditComment: string;
    feedDeleteComment: string;
    feedDeleteCommentConfirmTitle: string;
    feedDeleteCommentConfirmMessage: string;
    feedViewAllComments: (n: number) => string;
    viewDetail: string;
    feedTapHint: string;
    socialLoginRequired: string;
    socialLikeFailed: string;
    socialCommentFailed: string;
    socialCommentUpdateFailed: string;
    socialCommentDeleteFailed: string;
    bookmark: string;
    unbookmark: string;
    socialBookmarkFailed: string;
  }
> = {
  ko: {
    writeReview: '후기 남기기',
    editReview: '후기 수정',
    deleteReview: '후기 삭제',
    deleteReviewConfirmTitle: '후기 삭제',
    deleteReviewConfirmMessage:
      '이 장소 후기를 삭제할까요? 일정에서 장소 자체는 유지됩니다.',
    deleteReviewConfirm: '삭제',
    reviewTitle: '여행지 후기',
    placeLabel: '장소',
    ratingLabel: '평점',
    tagsLabel: '태그',
    tagPlaceholder: '태그 입력 후 추가',
    commentLabel: '코멘트',
    commentPlaceholder: '이곳에서의 경험을 남겨 주세요',
    mediaLabel: '사진 / 영상',
    addPhoto: '사진 추가',
    addVideo: '영상 추가',
    chooseFromLibrary: '갤러리에서 선택',
    takePhoto: '카메라로 촬영',
    takeVideo: '영상 촬영',
    mediaHint: '탭하면 첨부 파일을 제거할 수 있어요. 영상은 MP4/MOV, 사진은 JPEG/PNG/WebP (최대 50MB).',
    mediaPermissionDenied: '사진·카메라 권한이 필요합니다. 설정에서 허용해 주세요.',
    mediaPermissionTitle: '사진·카메라 접근',
    mediaPermissionLibraryDisclosure:
      '피드·후기에 사진과 영상을 첨부하려면 앨범 접근이 필요해요.',
    mediaPermissionCameraDisclosure:
      '피드·후기에 사진과 영상을 첨부하려면 카메라 접근이 필요해요.',
    mediaPermissionDetail:
      '허용을 누르면 기기 권한을 요청합니다. 거부해도 앱의 다른 기능은 계속 사용할 수 있어요.',
    mediaPermissionAllow: '허용',
    mediaPermissionDeny: '나중에',
    mediaPermissionOpenSettings: '설정 열기',
    mediaPickFailed: '미디어를 가져오지 못했어요. 다시 시도해 주세요.',
    mediaUploadFailed: '미디어 업로드 또는 후기 저장에 실패했어요.',
    mediaLimitReached: '미디어는 최대 20개까지 첨부할 수 있어요.',
    unsupportedVideoFormat: '영상은 MP4 또는 MOV 형식만 업로드할 수 있어요.',
    unsupportedImageFormat: '사진은 JPEG, PNG, WebP 형식만 업로드할 수 있어요.',
    fileTooLarge: '파일은 최대 50MB까지 첨부할 수 있어요.',
    save: '저장',
    cancel: '취소',
    recordsTitle: '여행 후기',
    recordsSub: '방문한 여행지마다 후기를 남기고, 원할 때 여행기를 게시할 수 있어요.',
    progress: (done, total) => `${done} / ${total}곳 후기 완료`,
    noReviewsYet: '아직 작성한 후기가 없어요',
    allReviewsDone: '모든 여행지 후기가 완료됐어요!',
    composeTravelogue: '여행기 작성하기',
    editTravelogue: '여행기 수정',
    composeTitle: '여행기 작성',
    composeSub: '작성한 후기를 바탕으로 여행기를 완성해 보세요. 후기가 없어도 등록할 수 있어요.',
    editTravelogueTitle: '여행기 수정',
    editTravelogueSub: '제목·본문과 공개 여부를 수정할 수 있어요.',
    travelogueTitle: '제목',
    travelogueTitlePlaceholder: '예: 부산 3박 4일 맛집 투어',
    overallRating: '종합 평점',
    overallRatingHint: '별을 눌러 종합 평점을 설정하세요',
    overallReview: '종합 후기',
    overallReviewPlaceholder: '이번 여행을 한 줄로 요약해 주세요',
    authorLabel: '작성자',
    visibilityLabel: '공개 여부',
    visibilityPublic: '공개',
    visibilityPrivate: '비공개',
    visibilityPublicHint: '다른 여행자들이 피드에서 볼 수 있어요',
    visibilityPrivateHint: '나만 볼 수 있어요. 피드에는 표시되지 않아요',
    coverImageLabel: '대표 이미지',
    coverImageHint: '선택하지 않으면 첫 번째 사진이 대표로 사용돼요',
    coverImageAuto: '자동',
    publish: '게시하기',
    saveTravelogue: '저장하기',
    published: '게시됨',
    publishedPublic: '공개',
    publishedPrivate: '비공개',
    viewFeed: '여행기 둘러보기',
    viewMyTravelogue: '내 여행기 보기',
    publishedSuccessPublic: '여행기가 공개 게시됐어요!',
    publishedSuccessPrivate: '여행기가 비공개로 저장됐어요!',
    updatedSuccessPublic: '여행기가 수정됐어요!',
    updatedSuccessPrivate: '여행기가 비공개로 저장됐어요!',
    feedTitle: '여행기',
    feedEmpty: '아직 게시된 여행기가 없어요',
    feedEmptySub: '공개로 게시된 여행기가 여기에 표시됩니다.',
    placeReviewsSection: '장소별 후기',
    stars: n => `${n}점`,
    visitFirst: '방문 체크 후 후기를 남길 수 있어요',
    publishedSuccess: '여행기가 게시됐어요!',
    completeTrip: '여행 완료 처리',
    completeTripConfirmTitle: '여행 완료 처리',
    completeTripConfirmMessage:
      '이 여행을 완료 처리할까요? 완료 후에는 활성 여행에서 제외됩니다.',
    completeTripConfirm: '완료 처리',
    composePartialHint: '후기를 모두 작성하지 않아도 여행기를 등록할 수 있어요',
    detailBy: name => `${name}님의 여행기`,
    overallSummary: '종합 후기',
    itinerarySection: '방문 순서',
    tripEndedSuccess: '여행이 종료됐어요. 새 여행을 시작해 보세요!',
    noReviewForPlace: '후기 없음',
    dayLabel: n => `Day ${n}`,
    visitedBadge: '방문',
    notVisitedBadge: '미방문',
    mapTitle: '여행 경로',
    mapSubtitle: '장소를 탭하면 지도가 해당 위치로 이동해요',
    tripPeriod: (start, end) => `${start} ~ ${end}`,
    totalDuration: d => `총 소요시간 ${d}`,
    helpfulLabel: '도움이 되었어요!',
    helpfulCount: n => `${n}명`,
    importPlan: '여행 계획 가져오기',
    importPlanConfirmTitle: '여행 계획 가져오기',
    importPlanConfirmMessage: title =>
      `"${title}" 일정을 내 여행 계획으로 추가할까요?`,
    importPlanDateTitle: '여행 날짜 설정',
    importPlanDateMessage: dayCount =>
      `${dayCount}일 일정이에요. 출발일을 정하면 종료일은 자동으로 맞춰져요.`,
    importPlanTitleLabel: '여행 제목 (선택)',
    importPlanTitlePlaceholder: '여행 제목을 입력하세요',
    importPlanStartDateLabel: '출발일',
    importPlanEndDateLabel: '종료일',
    importPlanEndDateHint: '여행기 일수에 맞춰 자동 계산돼요',
    importPlanDayCountLabel: '일정',
    importPlanDayCount: n => `${n}일`,
    importPlanInvalidDate: '날짜는 YYYY-MM-DD 형식으로 입력해 주세요.',
    importPlanImporting: '가져오는 중…',
    importPlanFailed: '여행 계획 가져오기에 실패했습니다.',
    importPlanSuccess: '여행 계획을 가져왔어요!',
    importPlanSuccessSub: '내 여행 계획 목록에 추가됐어요. 바로 확인해 보세요.',
    importPlanGo: '계획 보기',
    importPlanClose: '확인',
    importPlanNoItinerary: '가져올 수 있는 일정 정보가 없어요.',
    tripPeriodLabel: '기간',
    importPlanActivePlanTitle: '진행 중인 여행이 있어요',
    importPlanActivePlanMessage: title =>
      `현재 "${title}" 여행이 진행 중이에요. 새 계획을 가져오면 해당 계획이 활성 여행이 됩니다. 계속할까요?`,
    importPlanActivePlanConfirm: '그래도 가져오기',
    activePlanLabel: '진행 중인 계획',
    feedCommentsTitle: '댓글',
    feedCommentPlaceholder: '응원의 댓글을 남겨보세요',
    feedCommentsEmpty: '아직 댓글이 없어요. 첫 댓글을 남겨보세요!',
    feedAddComment: '등록',
    feedEditComment: '수정',
    feedDeleteComment: '삭제',
    feedDeleteCommentConfirmTitle: '댓글 삭제',
    feedDeleteCommentConfirmMessage: '이 댓글을 삭제할까요?',
    feedViewAllComments: n => `댓글 ${n}개 모두 보기`,
    viewDetail: '자세히 보기',
    feedTapHint: '탭하면 상세 여행기를 볼 수 있어요',
    socialLoginRequired: '로그인이 필요해요.',
    socialLikeFailed: '좋아요 처리에 실패했어요.',
    socialCommentFailed: '댓글 등록에 실패했어요.',
    socialCommentUpdateFailed: '댓글 수정에 실패했어요.',
    socialCommentDeleteFailed: '댓글 삭제에 실패했어요.',
    bookmark: '북마크',
    unbookmark: '북마크 해제',
    socialBookmarkFailed: '북마크 처리에 실패했어요.',
  },
  en: {
    writeReview: 'Write review',
    editReview: 'Edit review',
    deleteReview: 'Delete review',
    deleteReviewConfirmTitle: 'Delete review',
    deleteReviewConfirmMessage:
      'Delete this place review? The place stays on your itinerary.',
    deleteReviewConfirm: 'Delete',
    reviewTitle: 'Place review',
    placeLabel: 'Place',
    ratingLabel: 'Rating',
    tagsLabel: 'Tags',
    tagPlaceholder: 'Type a tag and add',
    commentLabel: 'Comment',
    commentPlaceholder: 'Share your experience here',
    mediaLabel: 'Photos / videos',
    addPhoto: 'Add photo',
    addVideo: 'Add video',
    chooseFromLibrary: 'Choose from library',
    takePhoto: 'Take photo',
    takeVideo: 'Record video',
    mediaHint: 'Tap an attachment to remove it. Files upload when you save.',
    mediaPermissionDenied: 'Photo and camera access is required. Please enable it in Settings.',
    mediaPermissionTitle: 'Photo & camera access',
    mediaPermissionLibraryDisclosure:
      'To attach photos and videos to your feed or review, album access is needed.',
    mediaPermissionCameraDisclosure:
      'To attach photos and videos to your feed or review, camera access is needed.',
    mediaPermissionDetail:
      'We’ll ask for device permission next. You can still use other app features if you decline.',
    mediaPermissionAllow: 'Allow',
    mediaPermissionDeny: 'Not now',
    mediaPermissionOpenSettings: 'Open Settings',
    mediaPickFailed: 'Could not pick media. Please try again.',
    mediaUploadFailed: 'Could not upload media or save the review.',
    mediaLimitReached: 'You can attach up to 20 media files.',
    unsupportedVideoFormat: 'Only MP4 or MOV videos are supported.',
    unsupportedImageFormat: 'Only JPEG, PNG, or WebP images are supported.',
    fileTooLarge: 'Files must be 50MB or smaller.',
    save: 'Save',
    cancel: 'Cancel',
    recordsTitle: 'Trip reviews',
    recordsSub: 'Review each stop and publish a travelogue whenever you are ready.',
    progress: (done, total) => `${done} / ${total} reviews done`,
    noReviewsYet: 'No reviews yet',
    allReviewsDone: 'All place reviews are complete!',
    composeTravelogue: 'Create travelogue',
    editTravelogue: 'Edit travelogue',
    composeTitle: 'Compose travelogue',
    composeSub: 'Complete your travelogue from the reviews you wrote. You can publish without any reviews.',
    editTravelogueTitle: 'Edit travelogue',
    editTravelogueSub: 'Update the title, summary, and visibility.',
    travelogueTitle: 'Title',
    travelogueTitlePlaceholder: 'e.g. 4-day Busan food tour',
    overallRating: 'Overall rating',
    overallRatingHint: 'Tap the stars to set your overall rating',
    overallReview: 'Overall review',
    overallReviewPlaceholder: 'Summarize this trip in a few sentences',
    authorLabel: 'Author',
    visibilityLabel: 'Visibility',
    visibilityPublic: 'Public',
    visibilityPrivate: 'Private',
    visibilityPublicHint: 'Visible to other travelers in the feed',
    visibilityPrivateHint: 'Only you can see this. It won\'t appear in the feed',
    coverImageLabel: 'Cover image',
    coverImageHint: 'If you skip this, the first photo becomes the cover',
    coverImageAuto: 'Auto',
    publish: 'Publish',
    saveTravelogue: 'Save',
    published: 'Published',
    publishedPublic: 'Public',
    publishedPrivate: 'Private',
    viewFeed: 'Browse travelogues',
    viewMyTravelogue: 'View my travelogue',
    publishedSuccessPublic: 'Travelogue published publicly!',
    publishedSuccessPrivate: 'Travelogue saved privately!',
    updatedSuccessPublic: 'Travelogue updated!',
    updatedSuccessPrivate: 'Travelogue saved privately!',
    feedTitle: 'Travelogues',
    feedEmpty: 'No travelogues yet',
    feedEmptySub: 'Public travelogues from other travelers will appear here.',
    placeReviewsSection: 'Place reviews',
    stars: n => `${n} stars`,
    visitFirst: 'Mark visited before writing a review',
    publishedSuccess: 'Travelogue published!',
    completeTrip: 'Mark trip complete',
    completeTripConfirmTitle: 'Mark trip complete',
    completeTripConfirmMessage:
      'Mark this trip as complete? It will no longer appear as your active trip.',
    completeTripConfirm: 'Complete',
    composePartialHint: 'You can publish a travelogue without completing every review',
    detailBy: name => `Travelogue by ${name}`,
    overallSummary: 'Overall review',
    itinerarySection: 'Visit order',
    tripEndedSuccess: 'Trip ended. Start a new journey!',
    noReviewForPlace: 'No review',
    dayLabel: n => `Day ${n}`,
    visitedBadge: 'Visited',
    notVisitedBadge: 'Not visited',
    mapTitle: 'Trip route',
    mapSubtitle: 'Tap a place to focus the map',
    tripPeriod: (start, end) => `${start} – ${end}`,
    totalDuration: d => `Total time ${d}`,
    helpfulLabel: 'Helpful!',
    helpfulCount: n => `${n}`,
    importPlan: 'Import trip plan',
    importPlanConfirmTitle: 'Import trip plan',
    importPlanConfirmMessage: title =>
      `Add the itinerary from "${title}" to your plans?`,
    importPlanDateTitle: 'Set trip dates',
    importPlanDateMessage: dayCount =>
      `This itinerary is ${dayCount} day(s). Pick a start date and the end date is calculated for you.`,
    importPlanTitleLabel: 'Trip title (optional)',
    importPlanTitlePlaceholder: 'Enter a trip title',
    importPlanStartDateLabel: 'Start date',
    importPlanEndDateLabel: 'End date',
    importPlanEndDateHint: 'Auto-calculated from the travelogue length',
    importPlanDayCountLabel: 'Length',
    importPlanDayCount: n => `${n} day(s)`,
    importPlanInvalidDate: 'Use YYYY-MM-DD format.',
    importPlanImporting: 'Importing…',
    importPlanFailed: 'Could not import the trip plan.',
    importPlanSuccess: 'Trip plan imported!',
    importPlanSuccessSub: 'It has been added to your plans. Take a look anytime.',
    importPlanGo: 'View plan',
    importPlanClose: 'OK',
    importPlanNoItinerary: 'There is no itinerary available to import.',
    tripPeriodLabel: 'Dates',
    importPlanActivePlanTitle: 'You have a trip in progress',
    importPlanActivePlanMessage: title =>
      `"${title}" is currently active. Importing a new plan will switch your active trip. Continue?`,
    importPlanActivePlanConfirm: 'Import anyway',
    activePlanLabel: 'Active plan',
    feedCommentsTitle: 'Comments',
    feedCommentPlaceholder: 'Leave an encouraging comment',
    feedCommentsEmpty: 'No comments yet. Be the first!',
    feedAddComment: 'Post',
    feedEditComment: 'Edit',
    feedDeleteComment: 'Delete',
    feedDeleteCommentConfirmTitle: 'Delete comment',
    feedDeleteCommentConfirmMessage: 'Delete this comment?',
    feedViewAllComments: n => `View all ${n} comments`,
    viewDetail: 'View details',
    feedTapHint: 'Tap to open the full travelogue',
    socialLoginRequired: 'Please sign in to continue.',
    socialLikeFailed: 'Could not update like.',
    socialCommentFailed: 'Could not post comment.',
    socialCommentUpdateFailed: 'Could not update comment.',
    socialCommentDeleteFailed: 'Could not delete comment.',
    bookmark: 'Bookmark',
    unbookmark: 'Remove bookmark',
    socialBookmarkFailed: 'Could not update bookmark.',
  },
  ja: {
    writeReview: 'レビューを書く',
    editReview: 'レビューを編集',
    deleteReview: 'レビューを削除',
    deleteReviewConfirmTitle: 'レビューを削除',
    deleteReviewConfirmMessage:
      'このスポットのレビューを削除しますか？日程の場所自体は残ります。',
    deleteReviewConfirm: '削除',
    reviewTitle: 'スポットレビュー',
    placeLabel: '場所',
    ratingLabel: '評価',
    tagsLabel: 'タグ',
    tagPlaceholder: 'タグを入力して追加',
    commentLabel: 'コメント',
    commentPlaceholder: 'ここでの体験を書いてください',
    mediaLabel: '写真 / 動画',
    addPhoto: '写真を追加',
    addVideo: '動画を追加',
    chooseFromLibrary: 'ライブラリから選択',
    takePhoto: 'カメラで撮影',
    takeVideo: '動画を撮影',
    mediaHint: 'タップで添付を削除できます。保存時にサーバーへアップロードされます。',
    mediaPermissionDenied: '写真・カメラの権限が必要です。設定で許可してください。',
    mediaPermissionTitle: '写真・カメラへのアクセス',
    mediaPermissionLibraryDisclosure:
      'フィード・レビューに写真や動画を添付するには、アルバムへのアクセスが必要です。',
    mediaPermissionCameraDisclosure:
      'フィード・レビューに写真や動画を添付するには、カメラへのアクセスが必要です。',
    mediaPermissionDetail:
      '許可を押すと端末の権限を求めます。拒否しても他の機能は使えます。',
    mediaPermissionAllow: '許可',
    mediaPermissionDeny: 'あとで',
    mediaPermissionOpenSettings: '設定を開く',
    mediaPickFailed: 'メディアを取得できませんでした。もう一度お試しください。',
    mediaUploadFailed: 'メディアのアップロードまたはレビュー保存に失敗しました。',
    mediaLimitReached: 'メディアは最大20件まで添付できます。',
    unsupportedVideoFormat: '動画は MP4 または MOV 形式のみアップロードできます。',
    unsupportedImageFormat: '写真は JPEG、PNG、WebP 形式のみアップロードできます。',
    fileTooLarge: 'ファイルは最大50MBまで添付できます。',
    save: '保存',
    cancel: 'キャンセル',
    recordsTitle: '旅行レビュー',
    recordsSub: '訪問した各スポットにレビューを書き、好きなタイミングで旅行記を公開できます。',
    progress: (done, total) => `${done} / ${total} 件完了`,
    noReviewsYet: 'まだレビューがありません',
    allReviewsDone: 'すべてのレビューが完了しました！',
    composeTravelogue: '旅行記を作成',
    editTravelogue: '旅行記を編集',
    composeTitle: '旅行記を作成',
    composeSub: '書いたレビューをもとに旅行記を完成させましょう。レビューがなくても登録できます。',
    editTravelogueTitle: '旅行記を編集',
    editTravelogueSub: 'タイトル・本文・公開設定を変更できます。',
    travelogueTitle: 'タイトル',
    travelogueTitlePlaceholder: '例：釜山3泊4日グルメ旅',
    overallRating: '総合評価',
    overallRatingHint: '星をタップして総合評価を設定してください',
    overallReview: '総合レビュー',
    overallReviewPlaceholder: '今回の旅行をまとめてください',
    authorLabel: '投稿者',
    visibilityLabel: '公開設定',
    visibilityPublic: '公開',
    visibilityPrivate: '非公開',
    visibilityPublicHint: '他の旅行者がフィードで閲覧できます',
    visibilityPrivateHint: '自分だけが閲覧できます。フィードには表示されません',
    coverImageLabel: 'カバー画像',
    coverImageHint: '未選択の場合は最初の写真がカバーになります',
    coverImageAuto: '自動',
    publish: '公開する',
    saveTravelogue: '保存する',
    published: '公開済み',
    publishedPublic: '公開',
    publishedPrivate: '非公開',
    viewFeed: '旅行記を見る',
    viewMyTravelogue: '自分の旅行記を見る',
    publishedSuccessPublic: '旅行記を公開しました！',
    publishedSuccessPrivate: '旅行記を非公開で保存しました！',
    updatedSuccessPublic: '旅行記を更新しました！',
    updatedSuccessPrivate: '旅行記を非公開で保存しました！',
    feedTitle: '旅行記',
    feedEmpty: 'まだ公開された旅行記がありません',
    feedEmptySub: '公開された旅行記がここに表示されます。',
    placeReviewsSection: 'スポット別レビュー',
    stars: n => `${n}点`,
    visitFirst: '訪問チェック後にレビューを書けます',
    publishedSuccess: '旅行記を公開しました！',
    completeTrip: '旅行完了にする',
    completeTripConfirmTitle: '旅行完了',
    completeTripConfirmMessage:
      'この旅行を完了にしますか？完了後はアクティブな旅行から外れます。',
    completeTripConfirm: '完了にする',
    composePartialHint: 'すべてのレビューがなくても旅行記を登録できます',
    detailBy: name => `${name}さんの旅行記`,
    overallSummary: '総合レビュー',
    itinerarySection: '訪問順',
    tripEndedSuccess: '旅行が終了しました。新しい旅を始めましょう！',
    noReviewForPlace: 'レビューなし',
    dayLabel: n => `Day ${n}`,
    visitedBadge: '訪問済み',
    notVisitedBadge: '未訪問',
    mapTitle: '旅行ルート',
    mapSubtitle: '場所をタップすると地図がその位置に移動します',
    tripPeriod: (start, end) => `${start} 〜 ${end}`,
    totalDuration: d => `総所要時間 ${d}`,
    helpfulLabel: '参考になった！',
    helpfulCount: n => `${n}人`,
    importPlan: '旅行プランを取り込む',
    importPlanConfirmTitle: '旅行プランを取り込む',
    importPlanConfirmMessage: title =>
      `「${title}」の日程を自分の旅行プランに追加しますか？`,
    importPlanDateTitle: '旅行日を設定',
    importPlanDateMessage: dayCount =>
      `${dayCount}日の日程です。出発日を決めると終了日は自動で決まります。`,
    importPlanTitleLabel: '旅行タイトル（任意）',
    importPlanTitlePlaceholder: '旅行タイトルを入力',
    importPlanStartDateLabel: '出発日',
    importPlanEndDateLabel: '終了日',
    importPlanEndDateHint: '旅行記の日数に合わせて自動計算されます',
    importPlanDayCountLabel: '日程',
    importPlanDayCount: n => `${n}日`,
    importPlanInvalidDate: '日付は YYYY-MM-DD 形式で入力してください。',
    importPlanImporting: '取り込み中…',
    importPlanFailed: '旅行プランの取り込みに失敗しました。',
    importPlanSuccess: '旅行プランを取り込みました！',
    importPlanSuccessSub: 'マイ旅行プランに追加されました。すぐに確認できます。',
    importPlanGo: 'プランを見る',
    importPlanClose: '確認',
    importPlanNoItinerary: '取り込める日程情報がありません。',
    tripPeriodLabel: '期間',
    importPlanActivePlanTitle: '進行中の旅行があります',
    importPlanActivePlanMessage: title =>
      `現在「${title}」が進行中です。新しいプランを取り込むと、アクティブな旅行が切り替わります。続けますか？`,
    importPlanActivePlanConfirm: 'それでも取り込む',
    activePlanLabel: '進行中のプラン',
    feedCommentsTitle: 'コメント',
    feedCommentPlaceholder: '応援コメントを書いてみましょう',
    feedCommentsEmpty: 'まだコメントがありません。最初のコメントをどうぞ！',
    feedAddComment: '投稿',
    feedEditComment: '編集',
    feedDeleteComment: '削除',
    feedDeleteCommentConfirmTitle: 'コメントを削除',
    feedDeleteCommentConfirmMessage: 'このコメントを削除しますか？',
    feedViewAllComments: n => `コメント${n}件をすべて見る`,
    viewDetail: '詳細を見る',
    feedTapHint: 'タップで旅行記の詳細を表示',
    socialLoginRequired: 'ログインが必要です。',
    socialLikeFailed: 'いいねに失敗しました。',
    socialCommentFailed: 'コメント投稿に失敗しました。',
    socialCommentUpdateFailed: 'コメントの編集に失敗しました。',
    socialCommentDeleteFailed: 'コメントの削除に失敗しました。',
    bookmark: 'ブックマーク',
    unbookmark: 'ブックマーク解除',
    socialBookmarkFailed: 'ブックマークの更新に失敗しました。',
  },
  zh: {
    writeReview: '写点评',
    editReview: '编辑点评',
    deleteReview: '删除点评',
    deleteReviewConfirmTitle: '删除点评',
    deleteReviewConfirmMessage: '要删除此地点评吗？行程中的地点会保留。',
    deleteReviewConfirm: '删除',
    reviewTitle: '地点点评',
    placeLabel: '地点',
    ratingLabel: '评分',
    tagsLabel: '标签',
    tagPlaceholder: '输入标签后添加',
    commentLabel: '评论',
    commentPlaceholder: '分享您在此的体验',
    mediaLabel: '照片 / 视频',
    addPhoto: '添加照片',
    addVideo: '添加视频',
    chooseFromLibrary: '从相册选择',
    takePhoto: '拍照',
    takeVideo: '拍摄视频',
    mediaHint: '点按附件可移除。保存时会上传到服务器。',
    mediaPermissionDenied: '需要照片和相机权限，请在设置中允许。',
    mediaPermissionTitle: '照片与相机访问',
    mediaPermissionLibraryDisclosure: '要将照片和视频添加到动态或点评，需要访问相册。',
    mediaPermissionCameraDisclosure: '要将照片和视频添加到动态或点评，需要使用相机。',
    mediaPermissionDetail: '点击允许后将请求设备权限。即使拒绝，仍可使用应用的其他功能。',
    mediaPermissionAllow: '允许',
    mediaPermissionDeny: '稍后',
    mediaPermissionOpenSettings: '打开设置',
    mediaPickFailed: '无法选择媒体，请重试。',
    mediaUploadFailed: '媒体上传或评价保存失败。',
    mediaLimitReached: '最多可附加 20 个媒体文件。',
    unsupportedVideoFormat: '视频仅支持 MP4 或 MOV 格式。',
    unsupportedImageFormat: '照片仅支持 JPEG、PNG、WebP 格式。',
    fileTooLarge: '文件大小不能超过 50MB。',
    save: '保存',
    cancel: '取消',
    recordsTitle: '旅行点评',
    recordsSub: '为每个到访地点写点评，随时可发布游记。',
    progress: (done, total) => `已完成 ${done} / ${total}`,
    noReviewsYet: '暂无点评',
    allReviewsDone: '所有地点点评已完成！',
    composeTravelogue: '撰写游记',
    editTravelogue: '编辑游记',
    composeTitle: '撰写游记',
    composeSub: '根据已写点评完成游记。没有点评也可以发布。',
    editTravelogueTitle: '编辑游记',
    editTravelogueSub: '可修改标题、正文与公开设置。',
    travelogueTitle: '标题',
    travelogueTitlePlaceholder: '例：釜山四天美食之旅',
    overallRating: '综合评分',
    overallRatingHint: '点击星星设置综合评分',
    overallReview: '综合点评',
    overallReviewPlaceholder: '用几句话总结这次旅行',
    authorLabel: '作者',
    visibilityLabel: '公开设置',
    visibilityPublic: '公开',
    visibilityPrivate: '私密',
    visibilityPublicHint: '其他旅行者可在动态中看到',
    visibilityPrivateHint: '仅自己可见，不会出现在动态中',
    coverImageLabel: '封面图片',
    coverImageHint: '不选择时将使用第一张照片作为封面',
    coverImageAuto: '自动',
    publish: '发布',
    saveTravelogue: '保存',
    published: '已发布',
    publishedPublic: '公开',
    publishedPrivate: '私密',
    viewFeed: '浏览游记',
    viewMyTravelogue: '查看我的游记',
    publishedSuccessPublic: '游记已公开发布！',
    publishedSuccessPrivate: '游记已私密保存！',
    updatedSuccessPublic: '游记已更新！',
    updatedSuccessPrivate: '游记已私密保存！',
    feedTitle: '游记',
    feedEmpty: '暂无已发布游记',
    feedEmptySub: '公开发布的游记会显示在这里。',
    placeReviewsSection: '各地点评',
    stars: n => `${n}分`,
    visitFirst: '标记到访后可写点评',
    publishedSuccess: '游记已发布！',
    completeTrip: '标记行程完成',
    completeTripConfirmTitle: '标记行程完成',
    completeTripConfirmMessage: '要将此行程标记为已完成吗？完成后将不再显示为进行中的行程。',
    completeTripConfirm: '完成',
    composePartialHint: '无需完成全部点评即可发布游记',
    detailBy: name => `${name}的游记`,
    overallSummary: '综合点评',
    itinerarySection: '访问顺序',
    tripEndedSuccess: '行程已结束，开始新的旅行吧！',
    noReviewForPlace: '无点评',
    dayLabel: n => `第 ${n} 天`,
    visitedBadge: '已到访',
    notVisitedBadge: '未到访',
    mapTitle: '行程路线',
    mapSubtitle: '点击地点，地图将移动到该位置',
    tripPeriod: (start, end) => `${start} ~ ${end}`,
    totalDuration: d => `总耗时 ${d}`,
    helpfulLabel: '有帮助！',
    helpfulCount: n => `${n}人`,
    importPlan: '导入旅行计划',
    importPlanConfirmTitle: '导入旅行计划',
    importPlanConfirmMessage: title => `将「${title}」的行程添加到我的旅行计划？`,
    importPlanDateTitle: '设置旅行日期',
    importPlanDateMessage: dayCount =>
      `共 ${dayCount} 天行程。选择出发日后，结束日会自动计算。`,
    importPlanTitleLabel: '旅行标题（可选）',
    importPlanTitlePlaceholder: '输入旅行标题',
    importPlanStartDateLabel: '出发日',
    importPlanEndDateLabel: '结束日',
    importPlanEndDateHint: '根据游记天数自动计算',
    importPlanDayCountLabel: '行程',
    importPlanDayCount: n => `${n}天`,
    importPlanInvalidDate: '请使用 YYYY-MM-DD 格式。',
    importPlanImporting: '导入中…',
    importPlanFailed: '导入旅行计划失败。',
    importPlanSuccess: '已导入旅行计划！',
    importPlanSuccessSub: '已添加到你的旅行计划，可随时查看。',
    importPlanGo: '查看计划',
    importPlanClose: '确认',
    importPlanNoItinerary: '没有可导入的行程信息。',
    tripPeriodLabel: '日期',
    importPlanActivePlanTitle: '你有进行中的旅行',
    importPlanActivePlanMessage: title =>
      `当前「${title}」正在进行。导入新计划后，活跃旅行将切换为新计划。是否继续？`,
    importPlanActivePlanConfirm: '仍然导入',
    activePlanLabel: '进行中的计划',
    feedCommentsTitle: '评论',
    feedCommentPlaceholder: '留下鼓励的评论吧',
    feedCommentsEmpty: '暂无评论，来发表第一条吧！',
    feedAddComment: '发布',
    feedEditComment: '编辑',
    feedDeleteComment: '删除',
    feedDeleteCommentConfirmTitle: '删除评论',
    feedDeleteCommentConfirmMessage: '要删除这条评论吗？',
    feedViewAllComments: n => `查看全部 ${n} 条评论`,
    viewDetail: '查看详情',
    feedTapHint: '点击查看完整游记',
    socialLoginRequired: '请先登录。',
    socialLikeFailed: '点赞失败。',
    socialCommentFailed: '评论发布失败。',
    socialCommentUpdateFailed: '评论修改失败。',
    socialCommentDeleteFailed: '评论删除失败。',
    bookmark: '收藏',
    unbookmark: '取消收藏',
    socialBookmarkFailed: '收藏更新失败。',
  },
};
