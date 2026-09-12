import {
  EMPTY_PARTICIPATION_RECORDS,
  sortParticipationRecordsNewestFirst,
  useEventParticipationStore,
} from '../src/stores/useEventParticipationStore';

describe('zustand empty array stability', () => {
  beforeEach(() => {
    useEventParticipationStore.getState().clearAll();
  });

  it('sortParticipationRecordsNewestFirst returns shared empty', () => {
    expect(sortParticipationRecordsNewestFirst([])).toBe(EMPTY_PARTICIPATION_RECORDS);
    expect(useEventParticipationStore.getState().listAll()).toBe(EMPTY_PARTICIPATION_RECORDS);
  });
});
