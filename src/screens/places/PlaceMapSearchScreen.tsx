import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaceDetailSheet } from '../../components/places/PlaceDetailSheet';
import { PlaceMapView } from '../../components/places/PlaceMapView';
import { PlaceSearchListItem } from '../../components/places/PlaceSearchListItem';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { TEST_ID } from '../../constants/e2e/testIds';
import { buildPlaceListMetaLine } from '../../constants/places/placeSearch';
import { usePlaceMapSearchScreen } from '../../hooks/places/usePlaceMapSearchScreen';
import { useAppLanguage } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { PLACE_MAP_SEARCH_TYPES } from '../../types/placesApi';
import type { BusanPlace } from '../../types/placeSearch';
import type { WizardPickedPlace } from '../../types/planWizard';
import { haversineKm } from '../../utils/geo/geo';
import { formatDistanceKm } from '../../utils/places/rebootPlaces';

type Props = NativeStackScreenProps<RootStackParamList, 'PlaceMapSearch'>;

function busanPlaceToPicked(place: BusanPlace): WizardPickedPlace {
  return {
    placeId: place.contentId || place.id,
    placeName: place.name,
    location: place.location,
    address: place.address || undefined,
    imageUrl: place.imageUrl,
  };
}

export function PlaceMapSearchScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const {
    copy,
    pickFor,
    contentTypeId,
    selectedPlace,
    detailOpen,
    detailLoading,
    mapCenter,
    location,
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
    isSearchCooldownActive,
    searchCooldownSeconds,
    captionSuffix,
    handleSelectPlace,
    handleCloseDetail,
    handleToggleBookmark,
    handleMapCenterChange,
    handleSearchHere,
    handleSubmitKeyword,
    handleClearKeyword,
    handleChangeContentType,
  } = usePlaceMapSearchScreen(route.params);

  const confirmWizardPick = () => {
    if (!pickFor || !selectedPlace) {
      return;
    }
    navigation.popTo('PlanWizard', {
      pickedPlace: busanPlaceToPicked(selectedPlace),
      pickKind: pickFor,
    });
  };

  return (
    <View
      testID={TEST_ID.placeSearch.screen}
      className="flex-1 bg-brand-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text" numberOfLines={1}>
          {copy.screenTitle}
        </Text>
      </View>

      <View className="border-b border-brand-border bg-brand-surface px-4 py-2">
        {pickFor ? null : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PLACE_MAP_SEARCH_TYPES.map(typeId => {
              const selected = contentTypeId === typeId;
              const label = copy.categoryLabels[typeId];
              return (
                <Pressable
                  key={typeId}
                  onPress={() => handleChangeContentType(typeId)}
                  testID={TEST_ID.placeSearch.category(typeId)}
                  accessibilityRole="button"
                  accessibilityLabel={copy.categoryTabA11y(label)}
                  className={`mr-2 rounded-full px-3 py-1.5 ${
                    selected ? 'bg-brand-primary' : 'bg-brand-background'
                  }`}>
                  <Text
                    className={`text-xs font-semibold ${
                      selected ? 'text-white' : 'text-brand-text'
                    }`}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
        <Text
          className={
            pickFor
              ? 'text-sm font-semibold text-brand-text'
              : 'mt-2 text-sm font-semibold text-brand-text'
          }>
          {summaryText}
        </Text>
        <Text className="mt-0.5 text-[11px] text-brand-muted">{copy.dataHint}</Text>
        {isSearchCooldownActive ? (
          <Text className="mt-1 text-xs text-brand-muted">
            {copy.searchCooldown(searchCooldownSeconds)}
          </Text>
        ) : null}
      </View>

      <View className="relative min-h-0 flex-1">
        <View className="min-h-0 flex-1">
          <PlaceMapView
            places={sortedPlaces}
            mapCenter={mapCenter ?? location}
            selectedId={selectedPlace?.id}
            bookmarkedIds={bookmarkedIds}
            onSelectPlace={handleSelectPlace}
            onMapCenterChange={handleMapCenterChange}
            mapTitle={copy.mapTitle}
            mapSubtitle={mapSubtitle}
            captionSuffix={captionSuffix}
          />
        </View>

        {showSearchHere ? (
          <View className="absolute left-0 right-0 top-3 z-20 items-center px-4">
            <Pressable
              onPress={handleSearchHere}
              disabled={isSearchCooldownActive}
              accessibilityRole="button"
              accessibilityLabel={
                isSearchCooldownActive
                  ? copy.searchCooldown(searchCooldownSeconds)
                  : copy.searchHere
              }
              className={`rounded-full px-4 py-2.5 shadow-md ${
                isSearchCooldownActive ? 'bg-brand-muted' : 'bg-brand-primary active:opacity-90'
              }`}>
              <Text className="text-sm font-bold text-white">
                {isSearchCooldownActive
                  ? copy.searchCooldown(searchCooldownSeconds)
                  : copy.searchHere}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View className="absolute inset-0 z-10 items-center justify-center bg-brand-background/70">
            <ActivityIndicator size="large" color="#0077B6" />
            <Text className="mt-3 text-sm text-brand-muted">{copy.loading}</Text>
          </View>
        ) : null}

        {!detailOpen ? (
          <View className="border-t border-brand-border bg-brand-surface">
            <View className="flex-row items-center gap-2 px-4 pt-3">
              <TextInput
                testID={TEST_ID.placeSearch.keyword}
                className="min-h-11 flex-1 rounded-2xl border border-brand-border bg-brand-background px-3 py-2.5 text-sm text-brand-text"
                value={keywordDraft}
                onChangeText={setKeywordDraft}
                placeholder={copy.keywordPlaceholder}
                placeholderTextColor="#94A3B8"
                returnKeyType="search"
                onSubmitEditing={handleSubmitKeyword}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={copy.keywordSearchA11y}
              />
              {isKeywordMode || keywordDraft.trim().length > 0 ? (
                <Pressable
                  onPress={handleClearKeyword}
                  accessibilityRole="button"
                  accessibilityLabel={copy.keywordClearA11y}
                  className="h-11 w-11 items-center justify-center rounded-2xl border border-brand-border bg-brand-background active:opacity-80">
                  <Text className="text-base font-bold text-brand-muted">×</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={handleSubmitKeyword}
                disabled={keywordDraft.trim().length === 0 || keywordLoading}
                testID={TEST_ID.placeSearch.search}
                accessibilityRole="button"
                accessibilityLabel={copy.keywordSearchA11y}
                className={`h-11 items-center justify-center rounded-2xl px-3 ${
                  keywordDraft.trim().length === 0 || keywordLoading
                    ? 'bg-brand-muted'
                    : 'bg-brand-primary active:opacity-90'
                }`}>
                <Text className="text-sm font-bold text-white">
                  {copy.keywordSearchButton}
                </Text>
              </Pressable>
            </View>

            {sortedPlaces.length === 0 ? (
              <View className="px-4 py-4">
                <Text className="text-center text-sm text-brand-muted">{emptyMessage}</Text>
              </View>
            ) : (
              <>
                <Text className="px-4 pt-3 text-xs text-brand-muted">{copy.selectHint}</Text>
                <ScrollView
                  className="max-h-56"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                  {sortedPlaces.map(place => {
                    const selected = selectedPlace?.id === place.id;
                    const distanceLabel = formatDistanceKm(
                      haversineKm(
                        distanceOrigin.lat,
                        distanceOrigin.lng,
                        place.location.lat,
                        place.location.lng,
                      ),
                      language,
                    );
                    const meta = buildPlaceListMetaLine(place, copy, distanceLabel);

                    return (
                      <PlaceSearchListItem
                        key={place.id}
                        place={place}
                        selected={selected}
                        meta={meta}
                        onPress={() => handleSelectPlace(place)}
                      />
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        ) : null}
      </View>

      <PlaceDetailSheet
        visible={detailOpen}
        place={selectedPlace}
        detail={selectedDetail}
        language={language}
        copy={copy}
        loading={detailLoading}
        bookmarked={selectedBookmarked}
        onToggleBookmark={handleToggleBookmark}
        onClose={handleCloseDetail}
        primaryAction={
          pickFor
            ? { label: copy.pickConfirm, onPress: confirmWizardPick }
            : null
        }
      />
    </View>
  );
}
