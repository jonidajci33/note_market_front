import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, TextInput, View } from "react-native";

type HomeSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
};

export function HomeSearchBar({ value, onChangeText, onClear }: HomeSearchBarProps) {
  const hasValue = value.trim().length > 0;

  return (
    <View className="h-14 flex-row items-center rounded-3xl border border-[#F2E9D6] bg-white px-4 shadow-sm shadow-[#ECE1CC]">
      <FontAwesome color="#94A3B8" name="search" size={16} />
      <TextInput
        autoCapitalize="none"
        className="flex-1 px-3 text-base text-slate-700"
        onChangeText={onChangeText}
        placeholder="Search"
        placeholderTextColor="#94A3B8"
        value={value}
      />
      {hasValue ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
          onPress={onClear}
        >
          <FontAwesome color="#64748B" name="times" size={14} />
        </Pressable>
      ) : null}
    </View>
  );
}
