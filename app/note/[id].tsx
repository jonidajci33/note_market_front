import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAddFreeNote } from "@/hooks/useAddFreeNote";
import { useNoteDetail } from "@/hooks/useNoteDetail";
import { usePurchaseNote } from "@/hooks/usePurchaseNote";
import { useAuthStore } from "@/store/auth";

function formatPrice(price?: number | null) {
  if (price == null || price <= 0) return "Free";
  return `$${price.toFixed(2)}`;
}

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) {
      router.replace("/auth/login");
    }
  }, [token]);

  const noteId = typeof id === "string" ? id : "";
  const { data: note, isLoading, isError, error, refetch } = useNoteDetail(noteId);
  const purchase = usePurchaseNote(noteId);
  const addFree = useAddFreeNote(noteId);

  if (!noteId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8F6F0]">
        <Text className="text-base text-slate-500">Note not found.</Text>
      </SafeAreaView>
    );
  }

  const isFree = !note?.price || note.price <= 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F8F6F0]">
      <ScrollView className="flex-1 px-5 pt-5">
        {isLoading ? <Text className="text-sm text-slate-500">Loading note…</Text> : null}
        {isError ? (
          <View className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
            <Text className="text-sm font-semibold text-rose-600">
              {error instanceof Error ? error.message : "Unable to load note."}
            </Text>
            <Pressable className="mt-2 self-start rounded-full bg-rose-100 px-4 py-2" onPress={() => refetch()}>
              <Text className="text-sm font-semibold text-rose-600">Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {note ? (
          <View className="rounded-3xl border border-[#ECE2CF] bg-white p-6">
            <Text className="text-2xl font-black text-slate-800">{note.title}</Text>
            <Text className="mt-2 text-base text-slate-500">{note.description ?? "No description"}</Text>

            <View className="mt-4 flex-row items-center justify-between">
              <Text className="text-xl font-extrabold text-slate-800">{formatPrice(note.price)}</Text>
              <Text className="text-xs text-slate-400">{note.createdAt ?? ""}</Text>
            </View>

            {Array.isArray(note.tags) && note.tags.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {note.tags.map((tag: string) => (
                  <View key={tag} className="rounded-full bg-slate-100 px-3 py-1">
                    <Text className="text-xs font-semibold text-slate-600">#{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View className="mt-6">
              {isFree ? (
                <PrimaryButton
                  title={addFree.isLoading ? "Adding..." : "Add to Library"}
                  onPress={() => addFree.mutate()}
                  disabled={addFree.isLoading}
                />
              ) : (
                <PrimaryButton
                  title={purchase.isLoading ? "Buying..." : "Buy"}
                  onPress={() => purchase.mutate()}
                  disabled={purchase.isLoading}
                />
              )}
              {(purchase.isError || addFree.isError) && (
                <Text className="mt-3 text-sm font-semibold text-rose-600">
                  {(purchase.error as Error)?.message ?? (addFree.error as Error)?.message ?? "Action failed."}
                </Text>
              )}
              {(purchase.isSuccess || addFree.isSuccess) && (
                <Text className="mt-3 text-sm font-semibold text-emerald-700">Added to your library.</Text>
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
