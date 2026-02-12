import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import type { NoteSummary } from "@/hooks/useNotes";
import { useAuthStore } from "@/store/auth";

export type LibraryItem = {
  id?: string;
  itemType?: string;
  itemId?: string;
  grantedAt?: string;
  note?: NoteSummary | null;
  [key: string]: unknown;
};

function normalizeItems(payload: unknown): LibraryItem[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item) => {
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return {
        id: typeof record.id === "string" ? record.id : undefined,
        itemType: typeof record.itemType === "string" ? record.itemType : undefined,
        itemId: typeof record.itemId === "string" ? record.itemId : undefined,
        grantedAt: typeof record.grantedAt === "string" ? record.grantedAt : undefined,
      };
    }
    return {};
  });
}

export function useLibrary() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);

  return useQuery({
    queryKey: ["library", token],
    enabled: hydrated && Boolean(token),
    queryFn: async () => {
      const response = await apiRequest<unknown>("/api/v1/me/library", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const items = normalizeItems(response);

      const hydratedItems = await Promise.all(
        items.map(async (item) => {
          const type = typeof item.itemType === "string" ? item.itemType.toUpperCase() : "";
          if (type !== "NOTE" || !item.itemId) {
            return item;
          }

          try {
            const note = await apiRequest<NoteSummary>(`/api/v1/notes/${item.itemId}`);
            return { ...item, note };
          } catch {
            return { ...item, note: null };
          }
        }),
      );

      return hydratedItems;
    },
  });
}
