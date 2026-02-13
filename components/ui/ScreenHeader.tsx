import { type ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
  children?: ReactNode;
};

export function ScreenHeader({ title, subtitle, rightAction, children }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="relative px-5 pb-5"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="absolute inset-x-0 -top-10 h-64 rounded-b-[44px] bg-[#F6EECE]" />
      <View className="absolute -left-12 top-6 h-32 w-32 rounded-full bg-[#FDE7A5]/60" />
      <View className="absolute right-5 top-4 h-20 w-20 rounded-full bg-[#FFF5DA]/80" />
      <View className="absolute right-20 top-16 h-10 w-10 rounded-full bg-white/60" />

      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-3xl font-extrabold text-slate-800">{title}</Text>
          {subtitle ? (
            <Text className="mt-1 text-sm text-slate-600">{subtitle}</Text>
          ) : null}
        </View>
        {rightAction ?? null}
      </View>

      {children ? <View className="mt-4">{children}</View> : null}
    </View>
  );
}
