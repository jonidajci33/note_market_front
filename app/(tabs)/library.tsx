import { useMutation } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Linking, Pressable, SafeAreaView, Text, View } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useLibrary, type LibraryItem } from "@/hooks/useLibrary";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

type DownloadUrlResponse = {
  downloadUrl?: string;
  expiresAt?: string;
};

function formatGrantedAt(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatPrice(value: unknown): string {
  if (typeof value !== "number" || value <= 0) {
    return "Free";
  }
  return `$${value.toFixed(2)}`;
}

function isNoteItem(item: LibraryItem): item is LibraryItem & { itemId: string } {
  return typeof item.itemId === "string" && item.itemId.length > 0 && item.itemType?.toUpperCase() === "NOTE";
}

function LibraryCard({
  item,
  onViewNote,
  onDownloadNote,
  isDownloading,
}: {
  item: LibraryItem;
  onViewNote: (noteId: string) => void;
  onDownloadNote: (noteId: string) => void;
  isDownloading: boolean;
}) {
  const note = item.note;
  const noteId = isNoteItem(item) ? item.itemId : "";
  const title =
    note && typeof note.title === "string" && note.title.trim().length > 0
      ? note.title
      : item.itemType ?? "Unknown item";
  const description =
    note && typeof note.description === "string" && note.description.trim().length > 0
      ? note.description
      : null;

  return (
    <View className="mb-3 rounded-3xl border border-[#E5E7EB] bg-white p-4">
      <View className="flex-row items-center justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-base font-semibold text-slate-800">{title}</Text>
          <Text className="mt-1 text-xs text-slate-500">
            {noteId ? `Note ID: ${noteId}` : `Item ID: ${item.itemId ?? "n/a"}`}
          </Text>
        </View>
        <View className="rounded-full bg-[#EEF2FF] px-3 py-1">
          <Text className="text-xs font-semibold text-[#4338CA]">Entitled</Text>
        </View>
      </View>

      {note && typeof note.coverImageUrl === "string" && note.coverImageUrl.trim().length > 0 ? (
        <Image source={{ uri: note.coverImageUrl }} contentFit="cover" className="mt-3 h-24 w-full rounded-xl bg-slate-100" />
      ) : null}

      {description ? <Text className="mt-2 text-sm text-slate-500">{description}</Text> : null}

      {note ? (
        <Text className="mt-2 text-xs font-semibold text-[#D97706]">{formatPrice(note.price)}</Text>
      ) : null}

      <Text className="mt-3 text-xs text-slate-500">Granted at: {formatGrantedAt(item.grantedAt)}</Text>

      {noteId ? (
        <View className="mt-3 flex-row gap-3">
          <Pressable className="rounded-full bg-slate-100 px-4 py-2" onPress={() => onViewNote(noteId)}>
            <Text className="text-xs font-semibold text-slate-700">View</Text>
          </Pressable>
          <Pressable
            className={`rounded-full px-4 py-2 ${isDownloading ? "bg-emerald-300" : "bg-emerald-500"}`}
            disabled={isDownloading}
            onPress={() => onDownloadNote(noteId)}>
            <Text className="text-xs font-semibold text-white">{isDownloading ? "Opening..." : "Download"}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function LibraryScreen() {
  const token = useAuthStore((state) => state.token);
  const { data, isLoading, isError, error, refetch } = useLibrary();
  const items = data ?? [];

  const downloadNote = useMutation({
    mutationFn: async (noteId: string) => {
      if (!token) {
        throw new Error("You must be logged in to download notes.");
      }

      const response = await apiRequest<DownloadUrlResponse>(`/api/v1/notes/${noteId}/download`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const url = typeof response.downloadUrl === "string" ? response.downloadUrl : "";
      if (!url) {
        throw new Error("Download URL missing in backend response.");
      }

      await Linking.openURL(url);
      return noteId;
    },
  });

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
            <Pressable className="mt-3 self-start rounded-full bg-rose-100 px-4 py-2" onPress={() => refetch()}>
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
          <>
            <FlashList
              data={items}
              keyExtractor={(item, index) => item.id ?? `${index}`}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const noteId = isNoteItem(item) ? item.itemId : "";
                const isDownloading = downloadNote.isPending && downloadNote.variables === noteId;
                return (
                  <LibraryCard
                    item={item}
                    onViewNote={(id) => router.push(`/note/${id}`)}
                    onDownloadNote={(id) => downloadNote.mutate(id)}
                    isDownloading={isDownloading}
                  />
                );
              }}
            />
            {downloadNote.isError ? (
              <Text className="mt-3 text-sm font-semibold text-rose-600">
                {downloadNote.error instanceof Error ? downloadNote.error.message : "Unable to open download URL."}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
