import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventCallout } from '../../components/eventZone/EventCallout';
import { EventNavHeader } from '../../components/eventZone/EventNavHeader';
import {
  BRAND_BORDER,
  BRAND_MUTED,
  BRAND_PAGE_BG,
  BRAND_PRIMARY,
  BRAND_TEXT,
} from '../../components/eventZone/eventZoneTheme';
import { TEST_ID } from '../../constants/e2e/testIds';
import { useNotificationSettingsScreen } from '../../hooks/mypage/useNotificationSettingsScreen';
import { useAppLanguage } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import type { NotificationPreferenceKey } from '../../stores/useNotificationSettingsStore';
import { cn } from '../../utils/common/cn';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

type PreferenceRowProps = {
  label: string;
  hint: string;
  value: boolean;
  disabled?: boolean;
  last?: boolean;
  testID: string;
  onValueChange: (value: boolean) => void;
};

function PreferenceRow({
  label,
  hint,
  value,
  disabled,
  last,
  testID,
  onValueChange,
}: PreferenceRowProps) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-3 px-4 py-3.5',
        !last && 'border-b',
        disabled && 'opacity-50',
      )}
      style={!last ? { borderBottomColor: BRAND_BORDER } : undefined}>
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-semibold leading-[22px]" style={{ color: BRAND_TEXT }}>
          {label}
        </Text>
        <Text className="mt-0.5 text-[12px] leading-[18px]" style={{ color: BRAND_MUTED }}>
          {hint}
        </Text>
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: BRAND_BORDER, true: BRAND_PRIMARY }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={BRAND_BORDER}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      />
    </View>
  );
}

export function NotificationSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const {
    copy,
    isAuthenticated,
    hydrated,
    enabled,
    eventMission,
    eventReview,
    zoneChat,
    setEnabled,
    setPreference,
    goBack,
    goLogin,
  } = useNotificationSettingsScreen(navigation);

  const categoryDisabled = !isAuthenticated || !enabled;

  return (
    <View
      testID={TEST_ID.notificationSettings.screen}
      className="flex-1"
      style={{ paddingTop: insets.top, backgroundColor: BRAND_PAGE_BG }}>
      <View className="border-b border-[#E2E8F0] bg-white px-2">
        <EventNavHeader
          title={copy.screenTitle}
          subtitle={copy.subtitle}
          onBack={goBack}
          backAccessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
        />
      </View>

      {!hydrated ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}>
          <EventCallout title={copy.pushPendingTitle} body={copy.pushPendingBody} tone="info" />

          {!isAuthenticated ? (
            <Pressable
              accessibilityRole="button"
              onPress={goLogin}
              className="rounded-2xl border bg-white px-4 py-3 active:opacity-80"
              style={{ borderColor: BRAND_BORDER }}>
              <Text className="text-[13px] leading-5" style={{ color: BRAND_MUTED }}>
                {copy.loginRequired}
              </Text>
              <Text className="mt-1 text-[13px] font-bold" style={{ color: BRAND_PRIMARY }}>
                {copy.loginAction}
              </Text>
            </Pressable>
          ) : null}

          <View className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: BRAND_BORDER }}>
            <PreferenceRow
              label={copy.masterLabel}
              hint={copy.masterHint}
              value={enabled}
              disabled={!isAuthenticated}
              testID={TEST_ID.notificationSettings.master}
              onValueChange={setEnabled}
            />
          </View>

          <View>
            <Text className="mb-2 px-0.5 text-[13px] font-bold" style={{ color: BRAND_TEXT }}>
              {copy.categoriesTitle}
            </Text>
            <View className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: BRAND_BORDER }}>
              {(
                [
                  {
                    key: 'eventMission' as NotificationPreferenceKey,
                    label: copy.eventMissionLabel,
                    hint: copy.eventMissionHint,
                    value: eventMission,
                    testID: TEST_ID.notificationSettings.eventMission,
                  },
                  {
                    key: 'eventReview' as NotificationPreferenceKey,
                    label: copy.eventReviewLabel,
                    hint: copy.eventReviewHint,
                    value: eventReview,
                    testID: TEST_ID.notificationSettings.eventReview,
                  },
                  {
                    key: 'zoneChat' as NotificationPreferenceKey,
                    label: copy.zoneChatLabel,
                    hint: copy.zoneChatHint,
                    value: zoneChat,
                    testID: TEST_ID.notificationSettings.zoneChat,
                  },
                ] as const
              ).map((row, index, rows) => (
                <PreferenceRow
                  key={row.key}
                  label={row.label}
                  hint={row.hint}
                  value={row.value}
                  disabled={categoryDisabled}
                  last={index === rows.length - 1}
                  testID={row.testID}
                  onValueChange={next => setPreference(row.key, next)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
