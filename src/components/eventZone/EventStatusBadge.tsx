import { Text, View } from 'react-native';

import type { EventParticipationStatus } from '../../types/eventParticipation';

// Figma StatusBadge: Progress=#E8F4FC bg/#0077B6 text, Review=#FFF7ED bg/#B45309 text, Approved=#ECFDF5 bg/#047857 text, Rejected=#FEF2F2 bg/#DC2626 text
const STATUS_STYLE: Record<
  EventParticipationStatus,
  { bg: string; text: string }
> = {
  in_progress: { bg: '#E8F4FC', text: '#0077B6' },
  pending_review: { bg: '#FFF7ED', text: '#B45309' },
  approved: { bg: '#ECFDF5', text: '#047857' },
  rejected: { bg: '#FEF2F2', text: '#DC2626' },
};

type EventStatusBadgeProps = {
  label: string;
  status: EventParticipationStatus;
};

export function EventStatusBadge({ label, status }: EventStatusBadgeProps) {
  const style = STATUS_STYLE[status];

  return (
    <View
      className="items-center justify-center rounded-lg px-2 py-0.5"
      style={{ backgroundColor: style.bg }}>
      <Text className="text-[10px] font-bold leading-[14px]" style={{ color: style.text }}>
        {label}
      </Text>
    </View>
  );
}
