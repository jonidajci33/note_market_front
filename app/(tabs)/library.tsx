import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Pressable, SafeAreaView, Text, View } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useLibrary, type LibraryItem } from "@/hooks/useLibrary";

function formatGrantedAt(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function LibraryCard({ item }: { item: LibraryItem }) {
  return (
    <View className="mb-3 rounded-3xl border border-[#E5E7EB] bg-white p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-800">
            {item.itemType ?? "Unknown item"}
          </Text>
          <Text className="mt-1 text-xs text-slate-500">ID: {item.itemId ?? "n/a"}</Text>
        </View>
        <View className="rounded-full bg-[#EEF2FF] px-3 py-1">
          <Text className="text-xs font-semibold text-[#4338CA]">Entitled</Text>
        </View>
      </View>
      <Text className="mt-3 text-xs text-slate-500">Granted at: {formatGrantedAt(item.grantedAt)}</Text>
    </View>
  );
}

export default function LibraryScreen() {
  const { data, isLoading, isError, error, refetch } = useLibrary();
  const items = data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-[#F8F6F0]">
      <View className="flex-1 px-5 pb-6 pt-4">
        <Text className="mb-2 text-2xl font-extrabold text-slate-800">Your Library</Text>
        <Text className="mb-4 text-sm text-slate-500">Purchased or saved notes appear here.</Text>

        {isError ? (
          <View className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
            <Text className="text-sm font-semibold text-rose-600">
              {error instanceof Error ? error.message : "Unable to load library."}
            </Text>
            <Pressable
              className="mt-3 self-start rounded-full bg-rose-100 px-4 py-2"
              onPress={() => refetch()}>
              <Text className="text-sm font-semibold text-rose-600">Retry</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View className="rounded-3xl border border-[#ECE2CF] bg-white p-5">
            <Text className="text-base font-semibold text-slate-800">
              {isLoading ? "Loading your library..." : "No items yet"}
            </Text>
            <Text className="mt-2 text-sm text-slate-500">
              {isLoading ? "Fetching entitlements..." : "Purchase or save notes to see them here."}
            </Text>
            {!isLoading ? (
              <PrimaryButton className="mt-4" title="Browse notes" onPress={() => router.replace("/(tabs)")} />
            ) : null}
          </View>
        ) : (
          <FlashList
            data={items}
            keyExtractor={(item, index) => item.id ?? `${index}`}
            estimatedItemSize={90}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <LibraryCard item={item} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
