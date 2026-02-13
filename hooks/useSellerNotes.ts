import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import type { NoteSummary } from "@/hooks/useNotes";
import { useAuthStore } from "@/store/auth";

type SellerNotesPage = {
  content: NoteSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export function useSellerNotes(sellerId?: string) {
  return useQuery({
    queryKey: ["sellerNotes", sellerId],
    enabled: Boolean(sellerId),
    queryFn: async () => {
      const token = useAuthStore.getState().token;
      const response = await apiRequest<NoteSummary[]>("/api/v1/seller/notes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const notes = Array.isArray(response) ? response : [];
      return {
        content: notes,
        page: 0,
        size: notes.length,
        totalElements: notes.length,
        totalPages: 1,
      } as SellerNotesPage;
    },
  });
}
