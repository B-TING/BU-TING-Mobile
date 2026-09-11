import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import type { TravelRecord } from '../../../types/travelReview';
import {
  travelRecordDestinationLabel,
  travelRecordOverallRating,
  travelRecordThumbnailIcon,
} from '../../../utils/review/travelReview';
import { AppIcon } from '../../shared/icons/AppIcon';
import { ResolvedRemoteImage } from '../../shared/media/ResolvedRemoteImage';
import { StarRating } from '../../shared/rating/StarRating';

type TravelogueCardProps = {
  travelRecord: TravelRecord;
  onPress: () => void;
};

export function TravelogueCard({ travelRecord, onPress }: TravelogueCardProps) {
  const icon = travelRecordThumbnailIcon(travelRecord);
  const rating = travelRecordOverallRating(travelRecord);
  const destinationLabel = travelRecordDestinationLabel(travelRecord);
  const coverUri = travelRecord.coverImageUrl;
  const [coverFailed, setCoverFailed] = useState(false);
  const date = travelRecord.publishedAt
    ? new Date(travelRecord.publishedAt).toLocaleDateString()
    : '';

  useEffect(() => {
    setCoverFailed(false);
  }, [coverUri]);

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-3 active:opacity-90">
      <View className="mr-3 h-20 w-20 overflow-hidden rounded-xl bg-brand-selected">
        {coverUri && !coverFailed ? (
          <ResolvedRemoteImage
            uri={coverUri}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <AppIcon name={icon} size={32} color={ICON_COLOR_PRIMARY} />
          </View>
        )}
      </View>
      <View className="flex-1 justify-center">
        <Text className="mb-1 text-[10px] font-bold tracking-wide text-brand-primary">
          TRAVELOGUE
        </Text>
        <Text className="text-sm font-bold text-brand-text" numberOfLines={2}>
          {travelRecord.title ?? ''}
        </Text>
        <Text className="mt-1 text-xs text-brand-muted" numberOfLines={1}>
          {travelRecord.authorNickname} · {destinationLabel}
        </Text>
        <View className="mt-2 flex-row items-center gap-2">
          {rating > 0 ? (
            <>
              <StarRating value={rating} readonly size="sm" />
              {date ? <Text className="text-[10px] text-brand-muted">{date}</Text> : null}
            </>
          ) : date ? (
            <Text className="text-[10px] text-brand-muted">{date}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
