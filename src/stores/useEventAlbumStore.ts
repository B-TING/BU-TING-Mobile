import { create } from 'zustand';

import type {
  EventAlbumComment,
  EventAlbumPost,
  EventAlbumSort,
  EventAlbumVisibility,
} from '../types/eventAlbum';
import type { EventZoneId } from '../types/eventZone';
import type { EquippedTitleResponse } from '../types/zoneTitleApi';

export const EMPTY_ALBUM_POSTS: EventAlbumPost[] = [];
export const EMPTY_ALBUM_COMMENTS: EventAlbumComment[] = [];

type EventAlbumState = {
  posts: EventAlbumPost[];
  replacePosts: (posts: EventAlbumPost[]) => void;
  upsertPosts: (posts: EventAlbumPost[]) => void;
  setVisibility: (postId: string, visibility: EventAlbumVisibility) => void;
  setLike: (postId: string, likedByMe: boolean, likeCount: number) => void;
  setAuthorEquippedTitle: (
    authorId: string,
    equippedTitle: EquippedTitleResponse | undefined,
  ) => void;
  setComments: (
    postId: string,
    comments: EventAlbumComment[],
    commentCount?: number,
  ) => void;
  appendComment: (postId: string, comment: EventAlbumComment) => void;
  updateComment: (postId: string, comment: EventAlbumComment) => void;
  removeComment: (postId: string, commentId: string) => void;
  clearAll: () => void;
};

export function sortAlbumPosts(
  posts: EventAlbumPost[],
  sort: EventAlbumSort,
): EventAlbumPost[] {
  if (posts.length === 0) {
    return EMPTY_ALBUM_POSTS;
  }
  const next = [...posts];
  if (sort === 'most_liked') {
    next.sort((a, b) => {
      if (b.likeCount !== a.likeCount) {
        return b.likeCount - a.likeCount;
      }
      return Date.parse(b.completedAt) - Date.parse(a.completedAt);
    });
    return next;
  }
  next.sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  return next;
}

/** 공용 피드: 공개 게시물 + 내 비공개 게시물 */
export function selectVisibleAlbumPosts(
  posts: EventAlbumPost[],
  viewerUserId: string,
  filters?: { zoneId?: EventZoneId; eventId?: string },
): EventAlbumPost[] {
  return posts.filter(post => {
    if (filters?.zoneId && post.zoneId !== filters.zoneId) {
      return false;
    }
    if (filters?.eventId && post.eventId !== filters.eventId) {
      return false;
    }
    if (post.visibility === 'public') {
      return true;
    }
    return Boolean(viewerUserId) && (post.isMine || post.authorId === viewerUserId);
  });
}

export const useEventAlbumStore = create<EventAlbumState>()(set => ({
  posts: EMPTY_ALBUM_POSTS,
  replacePosts: posts => set({ posts }),
  upsertPosts: posts =>
    set(state => {
      if (posts.length === 0) {
        return state;
      }
      const next = [...state.posts];
      posts.forEach(post => {
        const index = next.findIndex(item => item.id === post.id);
        if (index < 0) {
          next.push(post);
          return;
        }
        const prev = next[index];
        next[index] = {
          ...prev,
          ...post,
          visibility:
            prev.visibility === 'private' ? 'private' : post.visibility,
          comments: prev.comments.length > 0 ? prev.comments : post.comments,
        };
      });
      return { posts: next };
    }),
  setVisibility: (postId, visibility) =>
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId ? { ...post, visibility } : post,
      ),
    })),
  setLike: (postId, likedByMe, likeCount) =>
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId ? { ...post, likedByMe, likeCount } : post,
      ),
    })),
  setAuthorEquippedTitle: (authorId, equippedTitle) =>
    set(state => ({
      posts: state.posts.map(post =>
        post.authorId === authorId || post.isMine
          ? { ...post, equippedTitle }
          : post,
      ),
    })),
  setComments: (postId, comments, commentCount) =>
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? {
              ...post,
              comments,
              commentCount: commentCount ?? comments.length,
            }
          : post,
      ),
    })),
  appendComment: (postId, comment) =>
    set(state => ({
      posts: state.posts.map(post => {
        if (post.id !== postId) {
          return post;
        }
        if (post.comments.some(item => item.id === comment.id)) {
          return post;
        }
        const comments = [...post.comments, comment];
        return {
          ...post,
          comments,
          commentCount: (post.commentCount ?? post.comments.length) + 1,
        };
      }),
    })),
  updateComment: (postId, comment) =>
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map(item =>
                item.id === comment.id ? { ...item, ...comment } : item,
              ),
            }
          : post,
      ),
    })),
  removeComment: (postId, commentId) =>
    set(state => ({
      posts: state.posts.map(post => {
        if (post.id !== postId) {
          return post;
        }
        const comments = post.comments.filter(item => item.id !== commentId);
        if (comments.length === post.comments.length) {
          return post;
        }
        return {
          ...post,
          comments,
          commentCount: Math.max(0, (post.commentCount ?? post.comments.length) - 1),
        };
      }),
    })),
  clearAll: () => set({ posts: EMPTY_ALBUM_POSTS }),
}));
