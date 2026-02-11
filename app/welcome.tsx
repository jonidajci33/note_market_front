import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { SafeAreaView, Text, View } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { WelcomeHeader } from "@/components/ui/WelcomeHeader";
import { useMe } from "@/hooks/useMe";
import { useAuthStore } from "@/store/auth";

function resolveGreetingName(input: unknown): string {
  if (!input || typeof input !== "object") {
    return "Learner";
  }

  const candidate = input as { name?: unknown; email?: unknown };
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  const email = typeof candidate.email === "string" ? candidate.email.trim() : "";

  return name || email || "Learner";
}

export default function WelcomeScreen() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const { user, isLoading, error } = useMe({
    enabled: hydrated && Boolean(token),
    fetchOnMount: true,
  });

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/auth/login");
    }
  }, [hydrated, token]);

  const greetingName = useMemo(() => resolveGreetingName(user), [user]);

  return (
    <SafeAreaView className="flex-1 bg-[#F7F6F0]">
      <View className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-[#DAF1E5]" />
      <View className="absolute right-0 top-12 h-28 w-28 rounded-full bg-[#FFE3BE]" />

      <View className="flex-1 justify-between">
        <WelcomeHeader greetingName={greetingName} />

        <View className="rounded-t-[36px] bg-white px-6 pb-10 pt-8 shadow shadow-slate-200">
          <Text className="text-xl font-extrabold text-slate-800">You are all set</Text>
          <Text className="mt-3 text-base leading-6 text-slate-500">
            Explore fresh notes, follow curated learning tracks, and keep your momentum every day.
          </Text>

          {isLoading ? <Text className="mt-4 text-sm text-slate-400">Syncing your profile...</Text> : null}
          {error ? <Text className="mt-4 text-sm text-rose-500">{error}</Text> : null}

          <PrimaryButton className="mt-8" onPress={() => router.replace("/(tabs)")} title="Next Step" />
        </View>
      </View>
    </SafeAreaView>
  );
}
