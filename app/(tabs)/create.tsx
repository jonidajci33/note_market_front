import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View, Pressable } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useSellerNotes } from "@/hooks/useSellerNotes";
import { useNiches, type Niche } from "@/hooks/useNiches";

type CreateNotePayload = {
  nicheId: string;
  courseId?: string | null;
  title: string;
  description?: string | null;
  price?: number | null;
  tags?: string[];
};

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export default function CreateNoteScreen() {
  const userId = useAuthStore((state) => (typeof state.user?.id === "string" ? state.user.id : ""));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [tags, setTags] = useState("api");
  const [nicheId, setNicheId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const { data: sellerNotes, isLoading: notesLoading, isError: notesError, error: notesErrorObj, refetch: refetchNotes } = useSellerNotes(userId);
  const { data: niches, isLoading: nichesLoading, isError: nichesError } = useNiches();

  const createNote = useMutation({
    mutationFn: async (payload: CreateNotePayload) => {
      return apiRequest("/api/v1/seller/notes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setPrice("0");
      setTags("api");
      setCourseId("");
      refetchNotes();
      Alert.alert("Note created", "Your note has been created. Upload content via seller tools.");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Could not create note.";
      setLocalError(message);
    },
  });

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && nicheId.trim().length > 0 && Number.isFinite(Number(price));
  }, [title, nicheId, price]);

  const handleSubmit = () => {
    setLocalError(null);

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setLocalError("Price must be a non-negative number.");
      return;
    }

    if (!canSubmit) {
      setLocalError("Please fill required fields: title, niche, price.");
      return;
    }

    createNote.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      price: numericPrice,
      tags: parseTags(tags),
      nicheId: nicheId.trim(),
      courseId: courseId.trim() || undefined,
    });
  };

  return (
    <ScrollView className="flex-1 bg-[#F8F6F0]" contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
      <View className="mb-4 rounded-3xl bg-white p-6 shadow shadow-slate-200">
        <Text className="text-2xl font-black text-slate-800">Create a new note</Text>
        <Text className="mt-2 text-sm text-slate-500">Provide basic details to publish your note. Upload content happens after creation.</Text>

        <View className="mt-5 gap-4">
          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800"
          />
          <TextInput
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800"
          />
          <TextInput
            placeholder="Price (e.g. 9.99)"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800"
          />
          <TextInput
            placeholder="Tags (comma separated)"
            value={tags}
            onChangeText={setTags}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800"
          />
          <View className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Text className="text-sm font-semibold text-slate-700">Niche</Text>
            {nichesLoading ? (
              <Text className="mt-1 text-sm text-slate-500">Loading niches...</Text>
            ) : nichesError ? (
              <Text className="mt-1 text-sm text-rose-600">Unable to load niches. Check connection.</Text>
            ) : (
              <View className="mt-2 flex-row flex-wrap gap-2">
                {(niches ?? []).map((n: Niche) => {
                  const active = nicheId === n.id;
                  return (
                    <Pressable
                      key={n.id}
                      onPress={() => setNicheId(n.id)}
                      className={`rounded-full px-3 py-2 ${active ? "bg-[#f97316]" : "bg-slate-100"}`}>
                      <Text className={`text-xs font-semibold ${active ? "text-white" : "text-slate-700"}`}>{n.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
          <TextInput
            placeholder="Course ID (optional UUID)"
            value={courseId}
            onChangeText={setCourseId}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800"
          />
        </View>

        {localError ? <Text className="mt-3 text-sm font-semibold text-rose-600">{localError}</Text> : null}
        {createNote.isError && !localError ? (
          <Text className="mt-3 text-sm font-semibold text-rose-600">{(createNote.error as Error)?.message ?? "Could not create note."}</Text>
        ) : null}

        <PrimaryButton className="mt-5" title={createNote.isLoading ? "Creating..." : "Create note"} disabled={!canSubmit || createNote.isLoading} onPress={handleSubmit} />
        <Text className="mt-3 text-xs text-slate-400">Login required. You can create and purchase notes with the same account.</Text>
      </View>

      <View className="rounded-3xl bg-white p-6 shadow shadow-slate-200">
        <Text className="text-xl font-extrabold text-slate-800">Your notes</Text>
        <Text className="mt-1 text-sm text-slate-500">Uploaded notes linked to your account.</Text>

        {notesLoading ? (
          <Text className="mt-4 text-sm text-slate-400">Loading your notes...</Text>
        ) : notesError ? (
          <Text className="mt-4 text-sm text-rose-600">{notesErrorObj instanceof Error ? notesErrorObj.message : "Unable to load notes."}</Text>
        ) : (sellerNotes?.content ?? []).length === 0 ? (
          <Text className="mt-4 text-sm text-slate-500">You have not uploaded any notes yet.</Text>
        ) : (
          (sellerNotes?.content ?? []).map((note) => (
            <View key={note.id ?? `${note.title}`} className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-slate-800">{note.title ?? "Untitled"}</Text>
                <View className="rounded-full bg-[#FFF3DF] px-3 py-1">
                  <Text className="text-xs font-semibold text-[#D97706]">{typeof note.price === "number" ? `$${note.price.toFixed(2)}` : "Free"}</Text>
                </View>
              </View>
              {note.description ? <Text className="mt-2 text-sm text-slate-500">{note.description}</Text> : null}
              {Array.isArray(note.tags) && note.tags.length > 0 ? (
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <View key={tag} className="rounded-full bg-slate-100 px-2 py-1">
                      <Text className="text-xs font-semibold text-slate-600">#{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
