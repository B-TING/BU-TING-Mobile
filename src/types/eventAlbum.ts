import type { EventZoneId, ZoneEventType } from './eventZone';
import type { EquippedTitleResponse } from './zoneTitleApi';

export type EventAlbumVisibility = 'public' | 'private';

export type EventAlbumSort = 'latest' | 'most_liked';

export type EventAlbumAuthType = Extract<ZoneEventType, 'PLACE_AUTH' | 'OBJECT_AUTH'>;

export type EventAlbumComment = {
  id: string;
  authorId: string;
  authorNickname: string;
  content: string;
  createdAt: string;
};

/** 구역 이벤트 앨범 게시물 (GET album → EventAlbumPost) */
export type EventAlbumPost = {
  id: string;
  /** 참여 UUID. PATCH visibility / 이력 연결 */
  participationId?: string;
  eventId: string;
  zoneId: EventZoneId;
  eventTitleKo: string;
  eventType: EventAlbumAuthType;
  authorId: string;
  authorNickname: string;
  equippedTitle?: EquippedTitleResponse;
  content?: string;
  localImageUri?: string;
  likeCount: number;
  likedByMe: boolean;
  comments: EventAlbumComment[];
  commentCount?: number;
  visibility: EventAlbumVisibility;
  isMine?: boolean;
  completedAt: string;
};
