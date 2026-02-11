import { Text, View } from "react-native";

export default function TabTwoScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F7F6F0] px-6">
      <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow shadow-slate-200">
        <Text className="text-2xl font-black text-slate-800">Library</Text>
        <Text className="mt-3 text-base leading-6 text-slate-500">
          Use this tab for secondary content like saved notes, progress, or account preferences.
        </Text>
      </View>
    </View>
  );
}
