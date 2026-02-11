import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";

import { FilterChipsRow, type NotesPriceFilter } from "@/components/ui/FilterChipsRow";
import { HomeSearchBar } from "@/components/ui/HomeSearchBar";
import { HomeTopBar } from "@/components/ui/HomeTopBar";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { type NoteSummary, useNotes } from "@/hooks/useNotes";
import { useAuthStore } from "@/store/auth";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_NOTES_TAGS = [
  "api"
];

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

  const userId = typeof user?.id === "string" ? user.id : "";
  const envSellerId = process.env.EXPO_PUBLIC_NOTES_SELLER_ID;
  const envNicheId = process.env.EXPO_PUBLIC_NOTES_NICHE_ID;
  const envTags = parseCsvList(process.env.EXPO_PUBLIC_NOTES_TAGS);

  const resolvedSellerId = isUuid(userId) ? userId : isUuid(envSellerId) ? envSellerId : "00000000-0000-0000-0000-000000000101";
  const resolvedNicheId = isUuid(envNicheId) ? envNicheId : "00000000-0000-0000-0000-000000000202";
  const resolvedTags = envTags.length > 0 ? envTags : DEFAULT_NOTES_TAGS;
  const backendCompatReady = resolvedSellerId.length > 0 && resolvedNicheId.length > 0 && resolvedTags.length > 0;

  const notesParams = useMemo(() => {
    const common = {
      nicheId: resolvedNicheId,
      sellerId: resolvedSellerId,
      tags: resolvedTags,
      q: debouncedSearch.trim().length > 0 ? debouncedSearch : "%",
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
        maxPrice: 999999999,
      };
    }

    return {
      ...common,
      minPrice: 0,
      maxPrice: 999999999,
    };
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

  return (
    <SafeAreaView className="flex-1 bg-[#F8F6F0]">
      <View className="relative px-5 pb-5 pt-4">
        <View className="absolute inset-x-0 -top-10 h-64 rounded-b-[44px] bg-[#F6EECE]" />
        <View className="absolute -left-12 top-6 h-32 w-32 rounded-full bg-[#FDE7A5]/60" />
        <View className="absolute right-5 top-4 h-20 w-20 rounded-full bg-[#FFF5DA]/80" />
        <View className="absolute right-20 top-16 h-10 w-10 rounded-full bg-white/60" />

        <View className="gap-4">
          <HomeTopBar
            greeting={greetingName ? `Hello, ${greetingName}!` : "Hello!"}
            isAuthenticated={isAuthenticated}
            onProfilePress={handleProfilePress}
            subtitle="Discover simple notes that match your next step."
          />
          <HomeSearchBar onChangeText={setSearchValue} onClear={() => setSearchValue("")} value={searchValue} />
          <FilterChipsRow activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        </View>
      </View>

      <View className="flex-1 px-5 pb-6">
        <Text className="mb-3 text-lg font-bold text-slate-800">Popular Notes</Text>

        {!backendCompatReady ? (
          <View className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <Text className="text-sm font-semibold text-amber-700">Notes feed is waiting for backend filter IDs.</Text>
            <Text className="mt-2 text-sm text-amber-700/90">
              Set `EXPO_PUBLIC_NOTES_SELLER_ID` and `EXPO_PUBLIC_NOTES_NICHE_ID` in `.env` to enable listing safely.
            </Text>
          </View>
        ) : isError ? (
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
              <View className="mb-3 rounded-3xl border border-[#ECE2CF] bg-white px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <Text className="mr-3 flex-1 text-base font-semibold text-slate-800">{item.title}</Text>
                  <View className="rounded-full bg-[#FFF3DF] px-3 py-1">
                    <Text className="text-xs font-semibold text-[#D97706]">{formatPrice(item.price)}</Text>
                  </View>
                </View>
                {typeof item.description === "string" && item.description.trim().length > 0 ? (
                  <Text className="mt-2 text-sm text-slate-500">{item.description}</Text>
                ) : (
                  <Text className="mt-2 text-sm text-slate-400">Short note description will appear here.</Text>
                )}
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
