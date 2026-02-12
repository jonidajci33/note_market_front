import { useMutation } from "@tanstack/react-query";
import { File as ExpoFile } from "expo-file-system";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { useNiches, type Niche } from "@/hooks/useNiches";
import { useSellerNotes } from "@/hooks/useSellerNotes";
import { type NoteSummary } from "@/hooks/useNotes";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

type CreateNotePayload = {
  nicheId: string;
  courseId?: string | null;
  title: string;
  description?: string | null;
  price?: number | null;
  tags?: string[];
};

type CreatedNoteResponse = {
  id: string;
};

type UploadUrlResponse = {
  uploadUrl: string;
  fileKey: string;
  expiresAt?: string;
};

type ConnectivityStatusResponse = {
  backendReachable: boolean;
  storageEnabled: boolean;
  minioReachable: boolean;
  endpoint?: string | null;
  bucket?: string | null;
  message?: string | null;
};

type Step = 1 | 2 | 3;
type PickedFile = Blob & {
  name?: string;
  size?: number;
  type?: string;
};
const CREATE_FLOW_VERSION = "2026-02-12-r6";
const INTERNAL_UPLOAD_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "minio"]);

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) {
    return "unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileFromPicker(result: unknown): PickedFile | null {
  if (Array.isArray(result)) {
    return result.length > 0 ? (result[0] as PickedFile) : null;
  }

  return result as PickedFile;
}

function normalizeType(file: PickedFile, fallback: string): string {
  const typed = typeof file.type === "string" ? file.type.trim() : "";
  return typed.length > 0 ? typed : fallback;
}

function isCancelError(err: unknown): boolean {
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  return message.includes("cancel") || message.includes("dismiss");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function summarizeUploadError(status: number, rawBody: string): string {
  const body = normalizeWhitespace(rawBody);
  const messageMatch = rawBody.match(/<Message>([^<]+)<\/Message>/i);
  const codeMatch = rawBody.match(/<Code>([^<]+)<\/Code>/i);

  if (messageMatch && messageMatch[1]) {
    const code = codeMatch && codeMatch[1] ? `${codeMatch[1]}: ` : "";
    return `Upload failed (${status}): ${code}${normalizeWhitespace(messageMatch[1])}`;
  }

  if (body.length > 0) {
    return `Upload failed (${status}): ${body.slice(0, 180)}`;
  }

  return `Upload failed (${status}).`;
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isInternalHost(host: string): boolean {
  return INTERNAL_UPLOAD_HOSTS.has(host) || host.endsWith(".minio");
}

function isPrivateIpv4(host: string): boolean {
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }

  const octets = host.split(".");
  if (octets.length !== 4) {
    return false;
  }
  const [first, second] = octets.map((value) => Number(value));
  if (![first, second].every(Number.isInteger)) {
    return false;
  }
  return first === 172 && second >= 16 && second <= 31;
}

function isLocalUsageHost(host: string): boolean {
  if (isInternalHost(host) || host.endsWith(".local")) {
    return true;
  }
  return isPrivateIpv4(host);
}

function mismatchUploadHostMessage(uploadUrl: string): string | null {
  const uploadHost = hostnameOf(uploadUrl);
  const apiHost = hostnameOf(process.env.EXPO_PUBLIC_API_URL ?? "");

  if (!uploadHost || !apiHost) {
    return null;
  }

  const uploadInternal = isInternalHost(uploadHost);
  const apiInternal = isInternalHost(apiHost);

  if (uploadInternal && !apiInternal) {
    return `Upload host (${uploadHost}) is not reachable from this device. Configure backend S3_PUBLIC_ENDPOINT to your API host (for example ${apiHost}).`;
  }

  return null;
}

function StepPill({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <View className={`rounded-full px-3 py-2 ${active ? "bg-[#f97316]" : done ? "bg-emerald-100" : "bg-slate-100"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-white" : done ? "text-emerald-700" : "text-slate-600"}`}>{label}</Text>
    </View>
  );
}

export default function CreateNoteScreen() {
  const userId = useAuthStore((state) => (typeof state.user?.id === "string" ? state.user.id : ""));

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [tags, setTags] = useState("api");
  const [nicheId, setNicheId] = useState("");
  const [courseId, setCourseId] = useState("");

  const [step, setStep] = useState<Step>(1);
  const [createdNoteId, setCreatedNoteId] = useState<string>("");

  const [coverFile, setCoverFile] = useState<PickedFile | null>(null);
  const [noteFile, setNoteFile] = useState<PickedFile | null>(null);

  const [coverUploadLoading, setCoverUploadLoading] = useState(false);
  const [noteUploadLoading, setNoteUploadLoading] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);
  const [localInfo, setLocalInfo] = useState<string | null>(null);
  const [connectivityInfo, setConnectivityInfo] = useState<string | null>(null);

  const { data: sellerNotes, isLoading: notesLoading, isError: notesError, error: notesErrorObj, refetch: refetchNotes } = useSellerNotes(userId);
  const { data: niches, isLoading: nichesLoading, isError: nichesError } = useNiches();

  const createNote = useMutation({
    mutationFn: async (payload: CreateNotePayload) => {
      return apiRequest<CreatedNoteResponse>("/api/v1/seller/notes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (note) => {
      const id = typeof note?.id === "string" ? note.id : "";
      if (!id) {
        setLocalError("Note was created but no note ID was returned.");
        return;
      }

      setCreatedNoteId(id);
      setStep(2);
      setLocalError(null);
      setLocalInfo("Details saved. Add a cover picture or skip to continue.");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Could not create note.";
      setLocalInfo(null);
      setLocalError(message);
    },
  });

  const canSubmitMetadata = useMemo(() => {
    return title.trim().length > 0 && nicheId.trim().length > 0 && Number.isFinite(Number(price));
  }, [title, nicheId, price]);

  const resetFlow = () => {
    setTitle("");
    setDescription("");
    setPrice("0");
    setTags("api");
    setNicheId("");
    setCourseId("");
    setStep(1);
    setCreatedNoteId("");
    setCoverFile(null);
    setNoteFile(null);
    setCoverUploadLoading(false);
    setNoteUploadLoading(false);
    setLocalError(null);
    setLocalInfo(null);
    setConnectivityInfo(null);
  };

  const requestCoverUploadSession = async (noteId: string, file: PickedFile) => {
    const contentType = normalizeType(file, "image/png");

    return apiRequest<UploadUrlResponse>(`/api/v1/seller/notes/${noteId}/cover-upload-url`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().token}`,
      },
      body: JSON.stringify({
        contentType,
        fileSize: typeof file.size === "number" ? file.size : undefined,
      }),
    });
  };

  const requestNoteUploadSession = async (noteId: string, file: PickedFile, fallbackType: string) => {
    const contentType = normalizeType(file, fallbackType);

    return apiRequest<UploadUrlResponse>(`/api/v1/seller/notes/${noteId}/upload-url`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().token}`,
      },
      body: JSON.stringify({
        contentType,
        fileSize: typeof file.size === "number" ? file.size : undefined,
      }),
    });
  };

  const ensureConnectivityBeforeUpload = async () => {
    const apiHost = hostnameOf(process.env.EXPO_PUBLIC_API_URL ?? "");
    if (apiHost && isLocalUsageHost(apiHost)) {
      setConnectivityInfo(`Local usage detected (${apiHost}); skipping connectivity preflight.`);
      return;
    }

    const status = await apiRequest<ConnectivityStatusResponse>("/api/v1/system/connectivity");
    const endpointText =
      typeof status.endpoint === "string" && status.endpoint.trim().length > 0 ? ` Endpoint: ${status.endpoint}.` : "";

    if (!status.minioReachable) {
      const reason =
        typeof status.message === "string" && status.message.trim().length > 0
          ? status.message
          : "Backend cannot reach MinIO.";
      throw new Error(`${reason}${endpointText}`);
    }

    setConnectivityInfo("Connectivity check passed: frontend -> backend -> MinIO.");
  };

  const uploadFileToPresignedUrl = async (session: UploadUrlResponse, file: PickedFile, fallbackType: string) => {
    const hostMismatch = mismatchUploadHostMessage(session.uploadUrl);
    if (hostMismatch) {
      throw new Error(hostMismatch);
    }

    const body = await file.arrayBuffer();
    let response: Response;
    try {
      response = await fetch(session.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": normalizeType(file, fallbackType),
        },
        body,
      });
    } catch (err) {
      const uploadHost = hostnameOf(session.uploadUrl) ?? "upload host";
      const original = err instanceof Error ? err.message : "Network request failed.";
      throw new Error(`Network error while uploading to ${uploadHost}. ${original} Check S3_PUBLIC_ENDPOINT/backend upload host config.`);
    }

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(summarizeUploadError(response.status, responseBody));
    }
  };

  const pickCover = async () => {
    setLocalError(null);
    setLocalInfo(null);

    try {
      const picked = fileFromPicker(await ExpoFile.pickFileAsync(undefined, "image/*"));
      if (picked) {
        setCoverFile(picked);
      }
    } catch (err) {
      if (isCancelError(err)) {
        return;
      }

      const message = err instanceof Error ? err.message : "Could not pick cover image.";
      setLocalInfo(null);
      setLocalError(message);
    }
  };

  const pickNoteFile = async () => {
    setLocalError(null);
    setLocalInfo(null);

    try {
      const picked = fileFromPicker(await ExpoFile.pickFileAsync(undefined, "application/pdf"));
      if (picked) {
        setNoteFile(picked);
      }
    } catch (err) {
      if (isCancelError(err)) {
        return;
      }

      const message = err instanceof Error ? err.message : "Could not pick note file.";
      setLocalInfo(null);
      setLocalError(message);
    }
  };

  const handleCreateMetadata = () => {
    setLocalError(null);
    setLocalInfo(null);

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setLocalInfo(null);
      setLocalError("Price must be a non-negative number.");
      return;
    }

    if (!canSubmitMetadata) {
      setLocalInfo(null);
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

  const handleSkipCover = () => {
    setLocalError(null);
    setLocalInfo("Cover skipped. Final step: upload the note file.");
    setStep(3);
  };

  const handleUploadCover = async () => {
    setLocalError(null);
    setLocalInfo(null);

    if (!createdNoteId) {
      setLocalInfo(null);
      setLocalError("Create note details first.");
      return;
    }

    if (!coverFile) {
      setLocalInfo(null);
      setLocalError("Pick a cover image or skip this step.");
      return;
    }

    setCoverUploadLoading(true);

    try {
      try {
        await ensureConnectivityBeforeUpload();
      } catch (err) {
        const connectivityMessage = err instanceof Error ? err.message : "Connectivity check failed.";
        throw new Error(`Connectivity preflight failed. ${connectivityMessage}`);
      }

      let session: UploadUrlResponse;
      try {
        session = await requestCoverUploadSession(createdNoteId, coverFile);
      } catch (err) {
        const sessionMessage = err instanceof Error ? err.message : "Could not request cover upload session.";
        throw new Error(`Cover upload session request failed at /cover-upload-url. ${sessionMessage}`);
      }
      await uploadFileToPresignedUrl(session, coverFile, "image/png");
      setStep(3);
      setLocalInfo("Cover uploaded. Final step: upload the note file.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not upload cover image.";
      setLocalInfo(null);
      setLocalError(message);
    } finally {
      setCoverUploadLoading(false);
    }
  };

  const handleUploadNoteAndFinish = async () => {
    setLocalError(null);
    setLocalInfo(null);

    if (!createdNoteId) {
      setLocalInfo(null);
      setLocalError("Create note details first.");
      return;
    }

    if (!noteFile) {
      setLocalInfo(null);
      setLocalError("Pick the note file (PDF) to finish.");
      return;
    }

    setNoteUploadLoading(true);

    try {
      try {
        await ensureConnectivityBeforeUpload();
      } catch (err) {
        const connectivityMessage = err instanceof Error ? err.message : "Connectivity check failed.";
        throw new Error(`Connectivity preflight failed. ${connectivityMessage}`);
      }

      const session = await requestNoteUploadSession(createdNoteId, noteFile, "application/pdf");
      await uploadFileToPresignedUrl(session, noteFile, "application/pdf");
      await refetchNotes();
      resetFlow();
      setLocalInfo("Note published successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not upload note file.";
      setLocalInfo(null);
      setLocalError(message);
    } finally {
      setNoteUploadLoading(false);
    }
  };

  const currentStepTitle = step === 1 ? "Step 1: Note details" : step === 2 ? "Step 2: Cover picture" : "Step 3: Note file";

  return (
    <ScrollView className="flex-1 bg-[#F8F6F0]" contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
      <View className="mb-4 rounded-3xl bg-white p-6 shadow shadow-slate-200">
        <Text className="text-2xl font-black text-slate-800">Create a new note</Text>
        <Text className="mt-2 text-sm text-slate-500">Use the guided flow to publish your note with files.</Text>

        <View className="mt-4 flex-row gap-2">
          <StepPill label="1. Details" active={step === 1} done={step > 1} />
          <StepPill label="2. Cover" active={step === 2} done={step > 2} />
          <StepPill label="3. File" active={step === 3} done={false} />
        </View>

        <Text className="mt-4 text-sm font-semibold text-slate-700">{currentStepTitle}</Text>

        {step === 1 ? (
          <View className="mt-4 gap-4">
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

            <PrimaryButton
              className="mt-2"
              title={createNote.isPending ? "Saving details..." : "Save details & continue"}
              disabled={!canSubmitMetadata || createNote.isPending}
              onPress={handleCreateMetadata}
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View className="mt-4 gap-4">
            <Text className="text-sm text-slate-600">Add a cover image to make your note more discoverable.</Text>

            <View className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              {coverFile ? (
                <View>
                  <Text className="text-sm font-semibold text-slate-800">{coverFile.name}</Text>
                  <Text className="mt-1 text-xs text-slate-500">{normalizeType(coverFile, "image/png")} • {formatFileSize(coverFile.size)}</Text>
                </View>
              ) : (
                <Text className="text-sm text-slate-500">No cover selected yet.</Text>
              )}
            </View>

            <PrimaryButton title="Pick cover image" onPress={pickCover} />

            <View className="flex-row gap-3">
              <Pressable
                onPress={handleSkipCover}
                className="flex-1 items-center rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <Text className="text-sm font-semibold text-slate-700">Skip</Text>
              </Pressable>
              <Pressable
                onPress={handleUploadCover}
                disabled={!coverFile || coverUploadLoading}
                className={`flex-1 items-center rounded-2xl px-4 py-3 ${!coverFile || coverUploadLoading ? "bg-orange-300" : "bg-[#f97316]"}`}>
                <Text className="text-sm font-semibold text-white">{coverUploadLoading ? "Uploading..." : "Upload cover"}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View className="mt-4 gap-4">
            <Text className="text-sm text-slate-600">Upload the note file (PDF) to finish publishing.</Text>

            <View className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              {noteFile ? (
                <View>
                  <Text className="text-sm font-semibold text-slate-800">{noteFile.name}</Text>
                  <Text className="mt-1 text-xs text-slate-500">{normalizeType(noteFile, "application/pdf")} • {formatFileSize(noteFile.size)}</Text>
                </View>
              ) : (
                <Text className="text-sm text-slate-500">No note file selected yet.</Text>
              )}
            </View>

            <PrimaryButton title="Pick note file" onPress={pickNoteFile} />
            <PrimaryButton
              title={noteUploadLoading ? "Uploading note..." : "Upload note & finish"}
              disabled={!noteFile || noteUploadLoading}
              onPress={handleUploadNoteAndFinish}
            />

            <Pressable className="self-start rounded-full bg-slate-100 px-4 py-2" onPress={() => setStep(2)}>
              <Text className="text-xs font-semibold text-slate-600">Back to cover step</Text>
            </Pressable>
          </View>
        ) : null}

        {localError ? <Text className="mt-3 text-sm font-semibold text-rose-600">{localError}</Text> : null}
        {connectivityInfo ? <Text className="mt-2 text-xs font-semibold text-sky-700">{connectivityInfo}</Text> : null}
        {localInfo ? <Text className="mt-3 text-sm font-semibold text-emerald-700">{localInfo}</Text> : null}
        {createNote.isError && !localError ? (
          <Text className="mt-3 text-sm font-semibold text-rose-600">{(createNote.error as Error)?.message ?? "Could not create note."}</Text>
        ) : null}

        <Text className="mt-4 text-xs text-slate-400">Login required. The same account can create and purchase notes.</Text>
        <Text className="mt-1 text-xs text-slate-300">Create flow build: {CREATE_FLOW_VERSION}</Text>
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
          (sellerNotes?.content ?? []).map((note: NoteSummary) => (
            <View key={note.id ?? `${note.title}`} className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-slate-800">{note.title ?? "Untitled"}</Text>
                <View className="rounded-full bg-[#FFF3DF] px-3 py-1">
                  <Text className="text-xs font-semibold text-[#D97706]">{typeof note.price === "number" ? `$${note.price.toFixed(2)}` : "Free"}</Text>
                </View>
              </View>

              {typeof note.coverImageUrl === "string" && note.coverImageUrl.length > 0 ? (
                <Image source={{ uri: note.coverImageUrl }} contentFit="cover" className="mt-3 h-28 w-full rounded-xl bg-slate-100" />
              ) : null}

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
