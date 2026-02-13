import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { FilterChipsRow, type NotesPriceFilter } from "@/components/ui/FilterChipsRow";
import { HomeSearchBar } from "@/components/ui/HomeSearchBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { type NoteSummary, useNotes } from "@/hooks/useNotes";
import { useAuthStore } from "@/store/auth";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_NOTES_TAGS: string[] = [];

function getGreetingName(user: unknown): string {
  if (!user || typeof user !== "object") {
    return "";
  }

  const typedUser = user as { name?: unknown; email?: unknown };
  const name = typeof typedUser.name === "string" ? typedUser.name.trim() : "";
  const email = typeof typedUser.email === "string" ? typedUser.email.trim() : "";

  return name || email;
}

function formatPrice(price: unknown): string {
  if (typeof price !== "number") {
    return "Free";
  }

  if (price <= 0) {
    return "Free";
  }

  return `$${price.toFixed(2)}`;
}

function parseCsvList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export default function HomeScreen() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState<NotesPriceFilter>("all");

  const debouncedSearch = useDebouncedValue(searchValue, 300);
  const isAuthenticated = Boolean(token);
  const greetingName = getGreetingName(user);

  const envSellerId = process.env.EXPO_PUBLIC_NOTES_SELLER_ID;
  const envNicheId = process.env.EXPO_PUBLIC_NOTES_NICHE_ID;
  const envTags = parseCsvList(process.env.EXPO_PUBLIC_NOTES_TAGS);

  const resolvedSellerId = isUuid(envSellerId) ? envSellerId : "";
  const resolvedNicheId = isUuid(envNicheId) ? envNicheId : "";
  const resolvedTags = envTags.length > 0 ? envTags : DEFAULT_NOTES_TAGS;

  const notesParams = useMemo(() => {
    const common = {
      nicheId: resolvedNicheId || undefined,
      sellerId: resolvedSellerId || undefined,
      tags: resolvedTags.length > 0 ? resolvedTags : undefined,
      q: debouncedSearch.trim().length > 0 ? debouncedSearch : undefined,
      sort: "CREATED_AT_DESC" as const,
      page: 0,
      size: 20,
    };

    if (activeFilter === "free") {
      return {
        ...common,
        minPrice: 0,
        maxPrice: 0,
      };
    }

    if (activeFilter === "paid") {
      return {
        ...common,
        minPrice: 0.01,
      };
    }

    return common;
  }, [resolvedNicheId, resolvedSellerId, resolvedTags, debouncedSearch, activeFilter]);

  const { data, isLoading, isError, error, refetch } = useNotes(notesParams);
  const notes = data?.content ?? [];

  const handleProfilePress = () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    router.push("/session");
  };

  const profileButton = (
    <Pressable
      accessibilityLabel="Open session"
      accessibilityRole="button"
      className="h-12 w-12 items-center justify-center rounded-full border border-[#EFE5CE] bg-white shadow-sm shadow-[#E9DFC9]"
      onPress={handleProfilePress}
    >
      {isAuthenticated ? (
        <Image
          className="h-9 w-9 rounded-full bg-[#F9F4E8]"
          contentFit="cover"
          source={require("../../assets/images/icon.png")}
        />
      ) : (
        <FontAwesome color="#64748B" name="bell-o" size={18} />
      )}
    </Pressable>
  );

  return (
    <View className="flex-1 bg-[#F8F6F0]">
      <ScreenHeader
        title={greetingName ? `Hello, ${greetingName}!` : "Hello!"}
        subtitle="Discover simple notes that match your next step."
        rightAction={profileButton}
      >
        <HomeSearchBar onChangeText={setSearchValue} onClear={() => setSearchValue("")} value={searchValue} />
        <View className="mt-3">
          <FilterChipsRow activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        </View>
      </ScreenHeader>

      <View className="flex-1 px-5 pb-6">
        <Text className="mb-3 text-lg font-bold text-slate-800">Popular Notes</Text>

        {isError ? (
          <View className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
            <Text className="text-sm font-semibold text-rose-600">
              {error instanceof Error ? error.message : "Unable to load notes."}
            </Text>
            <Pressable className="mt-3 self-start rounded-full bg-rose-100 px-4 py-2" onPress={() => refetch()}>
              <Text className="text-sm font-semibold text-rose-600">Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlashList
            data={notes}
            keyExtractor={(item, index) => {
              const id = item.id;
              return typeof id === "string" && id.length > 0 ? id : `${index}`;
            }}
            ListEmptyComponent={
              <View className="rounded-3xl border border-[#ECE2CF] bg-white p-5">
                <Text className="text-base font-semibold text-slate-800">{isLoading ? "Loading notes..." : "No notes found"}</Text>
                <Text className="mt-2 text-sm text-slate-500">
                  {isLoading ? "Fetching fresh content for you." : "Try changing filters or search with another keyword."}
                </Text>
              </View>
            }
            renderItem={({ item }: { item: NoteSummary }) => (
              <Pressable
                onPress={() => {
                  const id = typeof item.id === "string" ? item.id : "";
                  if (id) {
                    router.push(`/note/${id}`);
                  }
                }}
                className="mb-3 rounded-3xl border border-[#ECE2CF] bg-white px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <Text className="mr-3 flex-1 text-base font-semibold text-slate-800">{item.title}</Text>
                  <View className="rounded-full bg-[#FFF3DF] px-3 py-1">
                    <Text className="text-xs font-semibold text-[#D97706]">{formatPrice(item.price)}</Text>
                  </View>
                </View>
                {typeof item.coverImageUrl === "string" && item.coverImageUrl.trim().length > 0 ? (
                  <Image
                    source={{ uri: item.coverImageUrl }}
                    contentFit="cover"
                    className="mt-3 bg-slate-100"
                    style={{ width: "100%", height: 112, borderRadius: 16 }}
                  />
                ) : null}
                {typeof item.description === "string" && item.description.trim().length > 0 ? (
                  <Text className="mt-3 text-sm text-slate-500">{item.description}</Text>
                ) : (
                  <Text className="mt-3 text-sm text-slate-400">Short note description will appear here.</Text>
                )}
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}
