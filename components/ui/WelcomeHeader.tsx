import { Image } from "expo-image";
import { Text, View } from "react-native";

type WelcomeHeaderProps = {
  greetingName: string;
};

export function WelcomeHeader({ greetingName }: WelcomeHeaderProps) {
  return (
    <View className="px-6 pb-4 pt-6">
      <View className="relative mb-7 h-52 w-full items-center justify-center overflow-hidden rounded-3xl bg-[#DCF4EA]">
        <View className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-[#C2E9D8]" />
        <View className="absolute -bottom-7 -right-7 h-24 w-24 rounded-full bg-[#FFD6A6]" />
        <View className="absolute left-5 top-6 h-16 w-20 rounded-2xl bg-white/85" />
        <View className="absolute bottom-8 right-7 h-20 w-24 rounded-2xl bg-white/90" />
        <Image className="h-28 w-28" contentFit="contain" source={require("../../assets/images/splash-icon.png")} />
        <Text className="mt-3 text-sm font-semibold text-slate-600">Your learning journey starts here</Text>
      </View>

      <Text className="text-3xl font-extrabold leading-tight text-slate-800">Hi, {greetingName}</Text>
      <Text className="mt-2 text-base leading-6 text-slate-500">Make yourself smarter with our courses</Text>
    </View>
  );
}
