import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";

import { useCategories, type Category } from "@/hooks/useCategories";
import { useNiches, type Niche } from "@/hooks/useNiches";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

function authHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export default function AdminScreen() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading: catLoading } = useCategories();

  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [showAddNiche, setShowAddNiche] = useState<string | null>(null);
  const [newNicheName, setNewNicheName] = useState("");
  const [newNicheSlug, setNewNicheSlug] = useState("");

  const createCategory = useMutation({
    mutationFn: async (payload: { slug: string; name: string }) =>
      apiRequest("/api/v1/categories", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCatName("");
      setNewCatSlug("");
      setShowAddCategory(false);
    },
  });

  const createNiche = useMutation({
    mutationFn: async (payload: { slug: string; name: string; categoryId: string }) =>
      apiRequest("/api/v1/niches", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["niches"] });
      setNewNicheName("");
      setNewNicheSlug("");
      setShowAddNiche(null);
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F8F6F0]">
      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-extrabold text-slate-800">Admin</Text>
          <Pressable className="rounded-full bg-slate-200 px-4 py-2" onPress={() => router.back()}>
            <Text className="text-sm font-semibold text-slate-700">Back</Text>
          </Pressable>
        </View>

        <Text className="mt-4 text-lg font-bold text-slate-800">Categories & Niches</Text>

        {catLoading ? (
          <Text className="mt-3 text-sm text-slate-500">Loading categories...</Text>
        ) : (
          <View className="mt-3 gap-3">
            {(categories ?? []).map((cat: Category) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                expanded={expandedCat === cat.id}
                onToggle={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                showAddNiche={showAddNiche === cat.id}
                onShowAddNiche={() => { setShowAddNiche(showAddNiche === cat.id ? null : cat.id); setNewNicheName(""); setNewNicheSlug(""); }}
                newNicheName={newNicheName}
                newNicheSlug={newNicheSlug}
                onNicheNameChange={setNewNicheName}
                onNicheSlugChange={setNewNicheSlug}
                onCreateNiche={() => {
                  if (newNicheName.trim() && newNicheSlug.trim()) {
                    createNiche.mutate({ slug: newNicheSlug.trim(), name: newNicheName.trim(), categoryId: cat.id });
                  }
                }}
                nicheLoading={createNiche.isPending}
              />
            ))}
          </View>
        )}

        <View className="mt-4">
          {showAddCategory ? (
            <View className="rounded-2xl border border-[#ECE2CF] bg-white p-4 gap-3">
              <Text className="text-sm font-semibold text-slate-700">New Category</Text>
              <TextInput
                placeholder="Name"
                value={newCatName}
                onChangeText={setNewCatName}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              />
              <TextInput
                placeholder="Slug (lowercase, no spaces)"
                value={newCatSlug}
                onChangeText={setNewCatSlug}
                autoCapitalize="none"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              />
              <View className="flex-row gap-2">
                <PrimaryButton
                  title={createCategory.isPending ? "Creating..." : "Create"}
                  disabled={!newCatName.trim() || !newCatSlug.trim() || createCategory.isPending}
                  onPress={() => createCategory.mutate({ slug: newCatSlug.trim(), name: newCatName.trim() })}
                />
                <Pressable className="rounded-full bg-slate-100 px-4 py-2" onPress={() => setShowAddCategory(false)}>
                  <Text className="text-sm font-semibold text-slate-600">Cancel</Text>
                </Pressable>
              </View>
              {createCategory.isError ? (
                <Text className="text-xs text-rose-600">
                  {createCategory.error instanceof Error ? createCategory.error.message : "Failed to create category"}
                </Text>
              ) : null}
            </View>
          ) : (
            <Pressable
              className="rounded-2xl border border-dashed border-[#ECE2CF] bg-white/60 p-4"
              onPress={() => setShowAddCategory(true)}
            >
              <Text className="text-center text-sm font-semibold text-[#6366f1]">+ Add Category</Text>
            </Pressable>
          )}
        </View>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryCard({
  category,
  expanded,
  onToggle,
  showAddNiche,
  onShowAddNiche,
  newNicheName,
  newNicheSlug,
  onNicheNameChange,
  onNicheSlugChange,
  onCreateNiche,
  nicheLoading,
}: {
  category: Category;
  expanded: boolean;
  onToggle: () => void;
  showAddNiche: boolean;
  onShowAddNiche: () => void;
  newNicheName: string;
  newNicheSlug: string;
  onNicheNameChange: (v: string) => void;
  onNicheSlugChange: (v: string) => void;
  onCreateNiche: () => void;
  nicheLoading: boolean;
}) {
  const { data: niches, isLoading } = useNiches(expanded ? category.id : undefined);

  return (
    <View className="rounded-2xl border border-[#ECE2CF] bg-white overflow-hidden">
      <Pressable className="flex-row items-center justify-between px-4 py-3" onPress={onToggle}>
        <View>
          <Text className="text-base font-semibold text-slate-800">{category.name}</Text>
          <Text className="text-xs text-slate-400">{category.slug}</Text>
        </View>
        <Text className="text-lg text-slate-400">{expanded ? "−" : "+"}</Text>
      </Pressable>

      {expanded ? (
        <View className="border-t border-[#ECE2CF] px-4 py-3">
          {isLoading ? (
            <Text className="text-sm text-slate-500">Loading niches...</Text>
          ) : (niches ?? []).length === 0 ? (
            <Text className="text-sm text-slate-500">No niches yet.</Text>
          ) : (
            <View className="gap-2">
              {(niches ?? []).map((n: Niche) => (
                <View key={n.id} className="flex-row items-center rounded-xl bg-slate-50 px-3 py-2">
                  <Text className="flex-1 text-sm font-medium text-slate-700">{n.name}</Text>
                  <Text className="text-xs text-slate-400">{n.slug}</Text>
                </View>
              ))}
            </View>
          )}

          {showAddNiche ? (
            <View className="mt-3 gap-2">
              <TextInput
                placeholder="Niche name"
                value={newNicheName}
                onChangeText={onNicheNameChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              />
              <TextInput
                placeholder="Niche slug"
                value={newNicheSlug}
                onChangeText={onNicheSlugChange}
                autoCapitalize="none"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              />
              <View className="flex-row gap-2">
                <PrimaryButton
                  title={nicheLoading ? "Creating..." : "Add Niche"}
                  disabled={!newNicheName.trim() || !newNicheSlug.trim() || nicheLoading}
                  onPress={onCreateNiche}
                />
                <Pressable className="rounded-full bg-slate-100 px-4 py-2" onPress={onShowAddNiche}>
                  <Text className="text-sm font-semibold text-slate-600">Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable className="mt-3 self-start" onPress={onShowAddNiche}>
              <Text className="text-sm font-semibold text-[#f97316]">+ Add Niche</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}
