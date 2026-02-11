import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView, Text, View } from "react-native";

import { useAuthStore } from "@/store/auth";

export default function IntroScreen() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const timeoutId = setTimeout(() => {
      router.replace(token ? "/welcome" : "/auth/login");
    }, 900);

    return () => clearTimeout(timeoutId);
  }, [hydrated, token]);

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7F1]">
      <View className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[#D8EFE2]" />
      <View className="absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-[#FFE8CA]" />
      <View className="absolute left-12 top-24 h-16 w-16 rounded-full bg-[#E7F8EF]" />

      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-8 h-32 w-32 items-center justify-center rounded-3xl bg-white shadow shadow-emerald-200">
          <Image className="h-24 w-24" contentFit="contain" source={require("../assets/images/splash-icon.png")} />
        </View>
        <Text className="text-center text-4xl font-black tracking-tight text-slate-800">Note Market</Text>
        <Text className="mt-3 text-center text-base text-slate-500">Your daily boost of practical learning.</Text>
        <Text className="mt-10 text-sm font-semibold text-slate-400">{hydrated ? "Loading your experience..." : "Preparing..."}</Text>
      </View>
    </SafeAreaView>
  );
}
