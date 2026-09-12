import { Text, View } from 'react-native';

// Figma StatCell: label 11px medium #64748B, value 15px bold #1E293B
type EventStatCellProps = {
  label: string;
  value: string;
};

export function EventStatCell({ label, value }: EventStatCellProps) {
  return (
    <View className="min-w-0 flex-1 px-3 py-2.5">
      <Text className="text-[11px] font-medium leading-[15px] text-[#64748B]">{label}</Text>
      <Text className="mt-0.5 text-[15px] font-bold leading-[22px] text-[#1E293B]">{value}</Text>
    </View>
  );
}

type EventStatRowProps = {
  items: EventStatCellProps[];
};

// Figma: rounded-2xl border bg-white, cells separated by divider
export function EventStatRow({ items }: EventStatRowProps) {
  return (
    <View className="flex-row overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-1">
      {items.map((item, idx) => (
        <View key={item.label} className="min-w-0 flex-1 flex-row">
          {idx > 0 ? <View className="w-px self-stretch bg-[#E2E8F0]" /> : null}
          <EventStatCell label={item.label} value={item.value} />
        </View>
      ))}
    </View>
  );
}
