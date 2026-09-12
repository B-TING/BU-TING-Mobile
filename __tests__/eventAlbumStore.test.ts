import { mergeAlbumPages } from '../src/services/eventZone/zoneEventService';
import {
  selectVisibleAlbumPosts,
  sortAlbumPosts,
} from '../src/stores/useEventAlbumStore';
import type { EventAlbumPost } from '../src/types/eventAlbum';

const basePost = (overrides: Partial<EventAlbumPost>): EventAlbumPost => ({
  id: 'p1',
  eventId: 'e1',
  zoneId: 'SUYEONG_NAMGU',
  eventTitleKo: '테스트',
  eventType: 'PLACE_AUTH',
  authorId: 'u1',
  authorNickname: '테스터',
  likeCount: 0,
  likedByMe: false,
  comments: [],
  visibility: 'public',
  completedAt: '2026-09-04T12:00:00.000Z',
  ...overrides,
});

describe('event album store helpers', () => {
  it('sorts by latest and most liked', () => {
    const posts = [
      basePost({ id: 'a', likeCount: 1, completedAt: '2026-09-01T00:00:00.000Z' }),
      basePost({ id: 'b', likeCount: 5, completedAt: '2026-09-03T00:00:00.000Z' }),
      basePost({ id: 'c', likeCount: 5, completedAt: '2026-09-02T00:00:00.000Z' }),
    ];

    expect(sortAlbumPosts(posts, 'latest').map(p => p.id)).toEqual(['b', 'c', 'a']);
    expect(sortAlbumPosts(posts, 'most_liked').map(p => p.id)).toEqual(['b', 'c', 'a']);
  });

  it('hides other users private posts but keeps mine', () => {
    const posts = [
      basePost({ id: 'pub', visibility: 'public', authorId: 'other' }),
      basePost({ id: 'priv-other', visibility: 'private', authorId: 'other' }),
      basePost({ id: 'priv-me', visibility: 'private', authorId: 'me' }),
    ];

    const visible = selectVisibleAlbumPosts(posts, 'me');
    expect(visible.map(p => p.id).sort()).toEqual(['priv-me', 'pub']);
  });

  it('keeps my private post even when viewer id is missing if isMine is set', () => {
    const posts = [
      basePost({ id: 'priv-me', visibility: 'private', isMine: true, authorId: 'me' }),
    ];
    expect(selectVisibleAlbumPosts(posts, '').map(p => p.id)).toEqual(['priv-me']);
  });

  it('keeps approved posts from other events when filtering by zone', () => {
    const posts = [
      basePost({ id: 'this-event', eventId: 'e-now', zoneId: 'SUYEONG_NAMGU' }),
      basePost({ id: 'prev-event', eventId: 'e-prev', zoneId: 'SUYEONG_NAMGU' }),
      basePost({ id: 'other-zone', eventId: 'e-x', zoneId: 'HAEUNDAE_GIJANG' }),
    ];

    const visible = selectVisibleAlbumPosts(posts, 'me', { zoneId: 'SUYEONG_NAMGU' });
    expect(visible.map(p => p.id).sort()).toEqual(['prev-event', 'this-event']);
  });

  it('keeps public posts from every zone when no zone filter is set', () => {
    const posts = [
      basePost({ id: 'haeundae', zoneId: 'HAEUNDAE_GIJANG' }),
      basePost({ id: 'suyeong', zoneId: 'SUYEONG_NAMGU' }),
    ];

    expect(selectVisibleAlbumPosts(posts, 'me').map(p => p.id).sort()).toEqual([
      'haeundae',
      'suyeong',
    ]);
  });
});

describe('mergeAlbumPages', () => {
  it('merges zone pages, drops duplicates, and sorts by latest', () => {
    const merged = mergeAlbumPages(
      [
        {
          items: [
            {
              participationId: 'p-old',
              eventId: 'e1',
              zoneId: 'HAEUNDAE_GIJANG',
              authorId: 'u1',
              completedAt: '2026-09-12T17:46:00.395592+09:00',
              likeCount: 0,
            },
          ],
          hasNext: false,
        },
        {
          items: [
            {
              participationId: 'p-new',
              eventId: 'e2',
              zoneId: 'SUYEONG_NAMGU',
              authorId: 'u1',
              completedAt: '2026-09-12T17:52:42.213167+09:00',
              likeCount: 0,
            },
            {
              participationId: 'p-old',
              eventId: 'e1',
              zoneId: 'HAEUNDAE_GIJANG',
              authorId: 'u1',
              completedAt: '2026-09-12T17:46:00.395592+09:00',
              likeCount: 0,
            },
          ],
          hasNext: false,
        },
      ],
      'LATEST',
    );

    expect(merged.items?.map(item => item.participationId)).toEqual(['p-new', 'p-old']);
  });
});
