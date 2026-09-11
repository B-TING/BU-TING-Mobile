import { collectTravelogueCoverCandidates } from '../src/utils/review/travelReview';
import type { PlaceReview } from '../src/types/travelReview';

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
});
