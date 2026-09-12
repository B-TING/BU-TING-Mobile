import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  defaultPlaceContentTypeId,
  isFestivalPlaceSearch,
  PLACE_SEARCH_CENTER_THRESHOLD_M,
  PLACE_SEARCH_RADIUS_M,
} from '../../constants/places/placeSearch';
import { useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { fetchPlaceDetail } from '../../services/places/placesApiService';
import {
  selectBookmarkedIdsForType,
  usePlaceBookmarkStore,
  usePlaceDetailCacheStore,
  usePlaceSearchStore,
} from '../../stores';
import type { EventZoneCoordinate } from '../../types/eventZone';
import type { BusanPlace } from '../../types/placeSearch';
import type { PlaceContentTypeId } from '../../types/placesApi';
import { sortBookmarkedFirst } from '../../utils/bookmark/sortBookmarkedFirst';
import { currentMonthDateRangeYyyymmdd } from '../../utils/places/festivalApiMapper';
import {
  centersDifferBeyondThreshold,
  resolveFestivalDateRange,
} from '../../utils/places/placeMapSearchHelpers';
import { logPlacesApiError } from '../../utils/places/placesApiLogger';
import { usePlaceMapUserLocation } from '../usePlaceMapUserLocation';
import { usePlaceMapKeywordSearch } from './usePlaceMapKeywordSearch';
import { usePlaceMapSearchCooldown } from './usePlaceMapSearchCooldown';

const EMPTY_PLACES: BusanPlace[] = [];
type RouteParams = RootStackParamList['PlaceMapSearch'];

export function usePlaceMapSearchScreen(routeParams: RouteParams) {
  const copy = useCopy('placeSearch');
  const radiusKm = PLACE_SEARCH_RADIUS_M / 1000;
  const { location } = usePlaceMapUserLocation();
  const mergePlaceDetails = usePlaceDetailCacheStore(s => s.mergeDetails);

  const initialType = defaultPlaceContentTypeId(routeParams?.contentTypeId);
  const [contentTypeId, setContentTypeId] = useState<PlaceContentTypeId>(initialType);
  const [selectedPlace, setSelectedPlace] = useState<BusanPlace | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchCenter, setSearchCenter] = useState<EventZoneCoordinate | null>(null);
  const [mapCenter, setMapCenter] = useState<EventZoneCoordinate | null>(null);
  const [festivalDateRange, setFestivalDateRange] = useState(() =>
    resolveFestivalDateRange(routeParams),
  );
  const selectedContentHandledRef = useRef<string | null>(null);

  const isFestivalMode = isFestivalPlaceSearch(contentTypeId);

  const handleKeywordSearchStart = useCallback(() => {
    setSelectedPlace(null);
    setDetailOpen(false);
  }, []);

  const handleKeywordFirstResult = useCallback((nextCenter: EventZoneCoordinate) => {
    setMapCenter(nextCenter);
  }, []);

  const {
    keywordDraft,
    setKeywordDraft,
    activeKeyword,
    keywordPlaces,
    keywordDetailsById,
    keywordLoading,
    keywordErrorMessage,
    isKeywordMode,
    runKeywordSearch,
    clearKeyword,
    applyDetailToKeywordPlace,
  } = usePlaceMapKeywordSearch({
    copy: {
      searchNoResults: copy.searchNoResults,
      searchServerError: copy.searchServerError,
    },
    onSearchStart: handleKeywordSearchStart,
    onFirstResult: handleKeywordFirstResult,
  });

  const cacheEntry = usePlaceSearchStore(s => s.cacheByType[contentTypeId]);
  const locationLoading = usePlaceSearchStore(s => s.isLoading(contentTypeId));
  const hasCacheForCenter = usePlaceSearchStore(s => s.hasCacheForCenter);
  const hasCacheForFestivalRange = usePlaceSearchStore(s => s.hasCacheForFestivalRange);
  const searchByLocation = usePlaceSearchStore(s => s.searchByLocation);
  const searchFestivalsByDateRange = usePlaceSearchStore(s => s.searchFestivalsByDateRange);
  const updateMapCenterInCache = usePlaceSearchStore(s => s.updateMapCenter);
  const getCacheEntry = usePlaceSearchStore(s => s.getEntry);
  const clearTypeCache = usePlaceSearchStore(s => s.clearTypeCache);
  const lastSearchRequestedAt = usePlaceSearchStore(
    s => s.lastSearchRequestedAtByType[contentTypeId] ?? null,
  );

  const cooldown = usePlaceMapSearchCooldown(lastSearchRequestedAt);

  const bookmarkedIds = usePlaceBookmarkStore(selectBookmarkedIdsForType(contentTypeId));
  const togglePlaceBookmark = usePlaceBookmarkStore(s => s.togglePlaceBookmark);
  const isPlaceBookmarked = usePlaceBookmarkStore(s => s.isPlaceBookmarked);

  const locationPlaces = cacheEntry?.places ?? EMPTY_PLACES;
  const places = isKeywordMode ? keywordPlaces : locationPlaces;
  const placeDetailsById = isKeywordMode
    ? keywordDetailsById
    : (cacheEntry?.placeDetailsById ?? {});
  const globalPlaceDetails = usePlaceDetailCacheStore(s => s.detailsByPlaceId);
  const locationError = isKeywordMode ? null : (cacheEntry?.error ?? null);
  const loading = isKeywordMode ? keywordLoading : locationLoading;

  const emptyMessage = isKeywordMode
    ? (keywordErrorMessage ?? copy.keywordEmptySub)
    : (locationError ?? copy.searchNoResults);

  useEffect(() => {
    if (routeParams?.contentTypeId) {
      setContentTypeId(defaultPlaceContentTypeId(routeParams.contentTypeId));
    }
    if (routeParams?.festivalEventStartDate || routeParams?.festivalEventEndDate) {
      setFestivalDateRange(resolveFestivalDateRange(routeParams));
    }
    selectedContentHandledRef.current = null;
    setSearchCenter(null);
    setMapCenter(null);
  }, [
    routeParams?.contentTypeId,
    routeParams?.festivalEventStartDate,
    routeParams?.festivalEventEndDate,
    routeParams?.selectedContentId,
  ]);

  const applyCachedCenters = useCallback(
    (typeId: PlaceContentTypeId) => {
      const cached = getCacheEntry(typeId);
      if (!cached) {
        return false;
      }
      setSearchCenter(cached.searchCenter);
      setMapCenter(cached.mapCenter);
      if (cached.festivalDateRange) {
        setFestivalDateRange(cached.festivalDateRange);
      }
      return true;
    },
    [getCacheEntry],
  );

  useEffect(() => {
    if (applyCachedCenters(contentTypeId)) {
      return;
    }
    setSearchCenter(prev => prev ?? location);
    setMapCenter(prev => prev ?? location);
  }, [contentTypeId, location, applyCachedCenters]);

  useEffect(() => {
    if (isKeywordMode) {
      return;
    }

    if (isFestivalMode) {
      if (!mapCenter) {
        return;
      }
      if (
        hasCacheForFestivalRange(
          festivalDateRange.eventStartDate,
          festivalDateRange.eventEndDate,
        )
      ) {
        return;
      }

      setSelectedPlace(null);
      setDetailOpen(false);

      void searchFestivalsByDateRange({
        eventStartDate: festivalDateRange.eventStartDate,
        eventEndDate: festivalDateRange.eventEndDate,
        mapCenter,
        serverErrorMessage: copy.searchServerError,
        refreshTooSoonMessage: copy.searchRefreshTooSoon,
      });
      return;
    }

    if (!searchCenter) {
      return;
    }
    if (hasCacheForCenter(contentTypeId, searchCenter)) {
      return;
    }

    setSelectedPlace(null);
    setDetailOpen(false);

    void searchByLocation({
      contentTypeId,
      searchCenter,
      mapCenter: mapCenter ?? searchCenter,
      serverErrorMessage: copy.searchServerError,
      refreshTooSoonMessage: copy.searchRefreshTooSoon,
    });
  }, [
    isKeywordMode,
    isFestivalMode,
    contentTypeId,
    searchCenter,
    mapCenter,
    festivalDateRange,
    hasCacheForCenter,
    hasCacheForFestivalRange,
    searchByLocation,
    searchFestivalsByDateRange,
    copy.searchServerError,
    copy.searchRefreshTooSoon,
  ]);

  useEffect(() => {
    const selectedContentId = routeParams?.selectedContentId;
    if (!selectedContentId || places.length === 0) {
      return;
    }
    const handleKey = `${selectedContentId}:${places.length}`;
    if (selectedContentHandledRef.current === handleKey) {
      return;
    }

    const place = places.find(item => item.contentId === selectedContentId);
    if (!place) {
      return;
    }

    selectedContentHandledRef.current = handleKey;
    setSelectedPlace(place);
    setDetailOpen(true);
    setMapCenter(place.location);
  }, [routeParams?.selectedContentId, places]);

  const showSearchHere = useMemo(() => {
    if (isKeywordMode || isFestivalMode) {
      return false;
    }
    if (!searchCenter || !mapCenter) {
      return false;
    }
    return centersDifferBeyondThreshold(
      searchCenter,
      mapCenter,
      PLACE_SEARCH_CENTER_THRESHOLD_M,
    );
  }, [isFestivalMode, isKeywordMode, searchCenter, mapCenter]);

  const sortedPlaces = useMemo(
    () => sortBookmarkedFirst(places, bookmarkedIds, (a, b) => a.name.localeCompare(b.name, 'ko')),
    [places, bookmarkedIds],
  );

  const distanceOrigin = searchCenter ?? mapCenter ?? location;

  const summaryText =
    isKeywordMode && activeKeyword
      ? copy.keywordSummary(activeKeyword, places.length)
      : isFestivalMode
        ? copy.festivalSummary(places.length)
        : copy.summary(places.length, radiusKm);

  const mapSubtitle = isFestivalMode ? copy.festivalMapSubtitle : copy.mapSubtitle;

  const selectedDetail = selectedPlace
    ? (placeDetailsById[selectedPlace.contentId] ??
      globalPlaceDetails[selectedPlace.contentId] ??
      null)
    : null;

  const selectedBookmarked = selectedPlace
    ? isPlaceBookmarked(selectedPlace.contentTypeId, selectedPlace.contentId)
    : false;

  const handleSelectPlace = useCallback(
    (place: BusanPlace) => {
      setSelectedPlace(place);
      setDetailOpen(true);
      setMapCenter(place.location);

      const cached =
        (isKeywordMode ? keywordDetailsById[place.contentId] : undefined) ??
        usePlaceSearchStore.getState().getEntry(contentTypeId)?.placeDetailsById[place.contentId] ??
        usePlaceDetailCacheStore.getState().detailsByPlaceId[place.contentId];

      if (cached) {
        return;
      }

      setDetailLoading(true);
      const googleSearchText =
        [place.name, place.address].filter(Boolean).join(' ').trim() || undefined;
      void fetchPlaceDetail({
        contentId: place.contentId,
        contentTypeId: place.contentTypeId,
        googleSearchText,
        fallbackName: place.name,
        fallbackAddress: place.address,
        fallbackImageUrl: place.imageUrl,
      })
        .then(detail => {
          if (!detail) {
            return;
          }
          mergePlaceDetails({ [place.contentId]: detail });
          if (isKeywordMode) {
            applyDetailToKeywordPlace(place.contentId, detail);
          }
        })
        .catch(detailError => {
          logPlacesApiError('GET', `/api/v1/places/${place.contentId}/detail`, detailError, {
            contentId: place.contentId,
            contentTypeId: place.contentTypeId,
          });
        })
        .finally(() => {
          setDetailLoading(false);
        });
    },
    [
      applyDetailToKeywordPlace,
      contentTypeId,
      isKeywordMode,
      keywordDetailsById,
      mergePlaceDetails,
    ],
  );

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const handleToggleBookmark = useCallback(() => {
    if (!selectedPlace) {
      return;
    }
    togglePlaceBookmark(selectedPlace.contentTypeId, selectedPlace.contentId);
  }, [selectedPlace, togglePlaceBookmark]);

  const handleMapCenterChange = useCallback(
    (center: EventZoneCoordinate) => {
      setMapCenter(center);
      updateMapCenterInCache(contentTypeId, center);
    },
    [contentTypeId, updateMapCenterInCache],
  );

  const handleSearchHere = useCallback(() => {
    if (!mapCenter || cooldown.isActive || isKeywordMode) {
      return;
    }
    clearTypeCache(contentTypeId);
    setSearchCenter({ lat: mapCenter.lat, lng: mapCenter.lng });
  }, [clearTypeCache, contentTypeId, cooldown.isActive, isKeywordMode, mapCenter]);

  const handleSubmitKeyword = useCallback(() => {
    void runKeywordSearch(keywordDraft, contentTypeId);
  }, [contentTypeId, keywordDraft, runKeywordSearch]);

  const handleClearKeyword = useCallback(() => {
    clearKeyword();
    setSelectedPlace(null);
    setDetailOpen(false);
  }, [clearKeyword]);

  const pickFor = routeParams?.pickFor ?? null;

  const handleChangeContentType = useCallback(
    (typeId: PlaceContentTypeId) => {
      if (pickFor || typeId === contentTypeId) {
        return;
      }

      setContentTypeId(typeId);
      setSelectedPlace(null);
      setDetailOpen(false);
      selectedContentHandledRef.current = null;

      if (isFestivalPlaceSearch(typeId)) {
        setFestivalDateRange(currentMonthDateRangeYyyymmdd());
      }

      if (isKeywordMode && activeKeyword) {
        void runKeywordSearch(activeKeyword, typeId);
        return;
      }

      if (applyCachedCenters(typeId)) {
        return;
      }

      const center = mapCenter ?? searchCenter ?? location;
      if (center) {
        setSearchCenter({ lat: center.lat, lng: center.lng });
        setMapCenter({ lat: center.lat, lng: center.lng });
      }
    },
    [
      activeKeyword,
      applyCachedCenters,
      contentTypeId,
      isKeywordMode,
      location,
      mapCenter,
      pickFor,
      runKeywordSearch,
      searchCenter,
    ],
  );

  const captionSuffix = useCallback(
    (place: BusanPlace) => copy.subtitleLabel(copy.categoryLabels[place.contentTypeId]),
    [copy],
  );

  return {
    copy,
    pickFor,
    contentTypeId,
    selectedPlace,
    detailOpen,
    detailLoading,
    mapCenter,
    location,
    isFestivalMode,
    isKeywordMode,
    keywordDraft,
    setKeywordDraft,
    keywordLoading,
    loading,
    emptyMessage,
    showSearchHere,
    sortedPlaces,
    distanceOrigin,
    summaryText,
    mapSubtitle,
    selectedDetail,
    selectedBookmarked,
    bookmarkedIds,
    isSearchCooldownActive: cooldown.isActive,
    searchCooldownSeconds: cooldown.seconds,
    captionSuffix,
    handleSelectPlace,
    handleCloseDetail,
    handleToggleBookmark,
    handleMapCenterChange,
    handleSearchHere,
    handleSubmitKeyword,
    handleClearKeyword,
    handleChangeContentType,
  };
}
