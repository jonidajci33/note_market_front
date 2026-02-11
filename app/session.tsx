import { router } from "expo-router";
import { Pressable, SafeAreaView, Text, View } from "react-native";

import { useAuthStore } from "@/store/auth";

export default function SessionScreen() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const email = typeof user?.email === "string" ? user.email : "No email";

  return (
    <SafeAreaView className="flex-1 bg-[#F8F6F0] px-5 pt-6">
      <View className="rounded-3xl border border-[#ECE2CF] bg-white p-6">
        <Text className="text-2xl font-extrabold text-slate-800">Session</Text>
        <Text className="mt-3 text-sm text-slate-500">Signed in as {email}</Text>
        <View className="mt-6 flex-row gap-3">
          <Pressable className="rounded-full bg-brand-500 px-5 py-2.5" onPress={() => router.back()}>
            <Text className="text-sm font-semibold text-white">Back</Text>
          </Pressable>
          <Pressable
            className="rounded-full bg-rose-500 px-5 py-2.5"
            onPress={() => {
              clearAuth();
              router.replace("/auth/login");
            }}>
            <Text className="text-sm font-semibold text-white">Logout</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
