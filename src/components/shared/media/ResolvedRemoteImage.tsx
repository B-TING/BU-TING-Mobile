import { useEffect, useState } from 'react';
import {
  Image,
  View,
  type ImageErrorEventData,
  type ImageStyle,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { selectReusableAccessToken, useAuthStore } from '../../../stores/useAuthStore';
import {
  extractFileKeyFromUri,
  hasPresignedQuery,
} from '../../../utils/media/fileKey';
import { resolveDisplayMediaUrl } from '../../../utils/media/resolveMediaUrl';

type ResolvedRemoteImageProps = {
  uri: string;
  fileKey?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat';
  onError?: (event: NativeSyntheticEvent<ImageErrorEventData>) => void;
};

function needsPresign(uri: string, fileKey?: string | null): boolean {
  if (hasPresignedQuery(uri)) {
    return false;
  }
  return Boolean(fileKey?.trim() || extractFileKeyFromUri(uri));
}

/**
 * 서명 없는 S3 URL 은 Presigned URL 을 받은 뒤에만 Image 에 넘긴다.
 * (서명 전 bare URL 로드 실패 → 목록 카드가 placeholder 로 고착되는 것 방지)
 */
export function ResolvedRemoteImage({
  uri,
  fileKey,
  style,
  resizeMode = 'cover',
  onError,
}: ResolvedRemoteImageProps) {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const [displayUri, setDisplayUri] = useState<string | null>(() =>
    needsPresign(uri, fileKey) ? null : uri,
  );
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRetried(false);

    const waitForPresign = needsPresign(uri, fileKey);
    if (!waitForPresign) {
      setDisplayUri(uri);
      return () => {
        cancelled = true;
      };
    }

    setDisplayUri(null);
    void (async () => {
      const resolved = await resolveDisplayMediaUrl(uri, {
        accessToken,
        fileKey,
      });
      if (!cancelled) {
        setDisplayUri(resolved || uri);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uri, fileKey, accessToken]);

  if (!displayUri) {
    return <View style={style as StyleProp<ViewStyle>} />;
  }

  return (
    <Image
      source={{ uri: displayUri }}
      style={style}
      resizeMode={resizeMode}
      onError={event => {
        if (!retried) {
          setRetried(true);
          void (async () => {
            const resolved = await resolveDisplayMediaUrl(uri, {
              accessToken,
              fileKey,
              forceRefresh: true,
            });
            if (resolved && resolved !== displayUri) {
              setDisplayUri(resolved);
              return;
            }
            onError?.(event);
          })();
          return;
        }
        onError?.(event);
      }}
    />
  );
}
