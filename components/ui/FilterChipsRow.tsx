import { FlashList } from "@shopify/flash-list";
import { Pressable, Text, View } from "react-native";

export type NotesPriceFilter = "all" | "free" | "paid";

type FilterChip = {
  key: NotesPriceFilter;
  label: string;
};

const FILTERS: FilterChip[] = [
  { key: "all", label: "All" },
  { key: "free", label: "Free" },
  { key: "paid", label: "Paid" },
];

type FilterChipsRowProps = {
  activeFilter: NotesPriceFilter;
  onFilterChange: (value: NotesPriceFilter) => void;
};

export function FilterChipsRow({ activeFilter, onFilterChange }: FilterChipsRowProps) {
  return (
    <View className="h-12">
      <FlashList
        data={FILTERS}
        horizontal
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          const isActive = item.key === activeFilter;

          return (
            <Pressable
              accessibilityRole="button"
              className={`mr-3 rounded-full border px-5 py-2.5 ${
                isActive ? "border-brand-500 bg-brand-500" : "border-[#E8DDC7] bg-white"
              }`}
              onPress={() => onFilterChange(item.key)}
            >
              <Text className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-600"}`}>{item.label}</Text>
            </Pressable>
          );
        }}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}
