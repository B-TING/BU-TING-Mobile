import { collectTravelogueCoverCandidates } from '../src/utils/review/travelReview';
import type { PlaceReview } from '../src/types/travelReview';

function reviewWithMedia(
  placeReviewId: string,
  media: PlaceReview['media'],
): PlaceReview {
  return {
    placeReviewId,
    travelRecordPlaceId: null,
    planPlaceId: placeReviewId,
    placeName: placeReviewId,
    rating: 5,
    content: null,
    tags: [],
    stayMinutes: null,
    media,
    createdAt: null,
    updatedAt: null,
  };
}

describe('collectTravelogueCoverCandidates', () => {
  it('collects unique image urls from place reviews', () => {
    const reviews: PlaceReview[] = [
      {
        placeReviewId: 'r1',
        travelRecordPlaceId: null,
        planPlaceId: 'p1',
        placeName: 'A',
        rating: 5,
        content: null,
        tags: [],
        stayMinutes: null,
        media: [
          { mediaId: 'm1', type: 'image', uri: 'https://cdn.example/a.jpg?sig=1' },
          { mediaId: 'm2', type: 'video', uri: 'https://cdn.example/v.mp4' },
        ],
        createdAt: null,
        updatedAt: null,
      },
      {
        placeReviewId: 'r2',
        travelRecordPlaceId: null,
        planPlaceId: 'p2',
        placeName: 'B',
        rating: 4,
        content: null,
        tags: [],
        stayMinutes: null,
        media: [
          { mediaId: 'm3', type: 'image', uri: 'https://cdn.example/a.jpg?sig=2' },
          { mediaId: 'm4', type: 'image', uri: 'https://cdn.example/b.jpg' },
        ],
        createdAt: null,
        updatedAt: null,
      },
    ];

    const candidates = collectTravelogueCoverCandidates(reviews);
    expect(candidates.map(c => c.storedUrl)).toEqual([
      'https://cdn.example/a.jpg',
      'https://cdn.example/b.jpg',
    ]);
  });

  it('includes cover and imageUrls extras', () => {
    const candidates = collectTravelogueCoverCandidates([], {
      imageUrls: ['https://cdn.example/x.jpg'],
      coverImageUrl: 'https://cdn.example/cover.jpg?token=1',
    });
    expect(candidates.map(c => c.storedUrl)).toEqual([
      'https://cdn.example/x.jpg',
      'https://cdn.example/cover.jpg',
    ]);
  });

  it('keeps signed display uri and strips query from stored url', () => {
    const signed = 'https://cdn.example/a.jpg?X-Amz-Signature=abc&token=1';
    const candidates = collectTravelogueCoverCandidates([
      reviewWithMedia('r1', [{ mediaId: 'm1', type: 'image', uri: signed }]),
    ]);
    expect(candidates).toEqual([
      { displayUri: signed, storedUrl: 'https://cdn.example/a.jpg' },
    ]);
  });

  it('skips video, blank uri, and duplicate cover already in reviews', () => {
    const candidates = collectTravelogueCoverCandidates(
      [
        reviewWithMedia('r1', [
          { mediaId: 'v1', type: 'video', uri: 'https://cdn.example/clip.mp4' },
          { mediaId: 'blank', type: 'image', uri: '   ' },
          { mediaId: 'm1', type: 'image', uri: 'https://cdn.example/a.jpg?sig=1' },
        ]),
      ],
      {
        imageUrls: ['', 'https://cdn.example/a.jpg?sig=2'],
        coverImageUrl: 'https://cdn.example/a.jpg?token=cover',
      },
    );
    expect(candidates.map(c => c.storedUrl)).toEqual(['https://cdn.example/a.jpg']);
  });

  it('strips query from relative uri in the fallback parser', () => {
    const candidates = collectTravelogueCoverCandidates([], {
      coverImageUrl: '/uploads/cover.jpg?token=1#frag',
    });
    expect(candidates).toEqual([
      {
        displayUri: '/uploads/cover.jpg?token=1#frag',
        storedUrl: '/uploads/cover.jpg',
      },
    ]);
  });

  it('returns empty when there are no image candidates', () => {
    expect(collectTravelogueCoverCandidates([])).toEqual([]);
    expect(
      collectTravelogueCoverCandidates([
        reviewWithMedia('r1', [
          { mediaId: 'v1', type: 'video', uri: 'https://cdn.example/clip.mp4' },
        ]),
      ]),
    ).toEqual([]);
  });
});
