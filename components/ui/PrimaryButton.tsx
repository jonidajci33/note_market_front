import { Pressable, Text, View } from "react-native";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

export function PrimaryButton({ title, onPress, disabled = false, loading = false, className = "" }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      className={`h-14 w-full items-center justify-center rounded-2xl ${
        isDisabled ? "bg-brand-400" : "bg-brand-500 active:bg-brand-600"
      } ${className}`}
      disabled={isDisabled}
      onPress={onPress}
    >
      <View className="items-center justify-center">
        <Text className="text-base font-bold text-white">{loading ? "Please wait..." : title}</Text>
      </View>
    </Pressable>
  );
}
