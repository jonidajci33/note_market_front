import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

type HomeTopBarProps = {
  greeting: string;
  subtitle: string;
  isAuthenticated: boolean;
  onProfilePress: () => void;
};

export function HomeTopBar({ greeting, subtitle, isAuthenticated, onProfilePress }: HomeTopBarProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1 pr-4">
        <Text className="text-3xl font-extrabold text-slate-800">{greeting}</Text>
        <Text className="mt-1 text-sm text-slate-600">{subtitle}</Text>
      </View>

      <Pressable
        accessibilityLabel="Open session"
        accessibilityRole="button"
        className="h-12 w-12 items-center justify-center rounded-full border border-[#EFE5CE] bg-white shadow-sm shadow-[#E9DFC9]"
        onPress={onProfilePress}
      >
        {isAuthenticated ? (
          <Image
            className="h-9 w-9 rounded-full bg-[#F9F4E8]"
            contentFit="cover"
            source={require("../../assets/images/icon.png")}
          />
        ) : (
          <FontAwesome color="#64748B" name="bell-o" size={18} />
        )}
      </Pressable>
    </View>
  );
}
