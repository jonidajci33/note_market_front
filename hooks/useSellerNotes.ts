import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import type { NotesPage, NotesQueryParams } from "@/hooks/useNotes";

export function useSellerNotes(sellerId?: string) {
  const params: NotesQueryParams = {
    sellerId,
    sort: "CREATED_AT_DESC",
    page: 0,
    size: 20,
  };

  return useQuery({
    queryKey: ["sellerNotes", sellerId],
    enabled: Boolean(sellerId),
    queryFn: async () => {
      const search = new URLSearchParams();
      if (sellerId) search.set("sellerId", sellerId);
      search.set("sort", "CREATED_AT_DESC");
      search.set("page", "0");
      search.set("size", "20");
      const response = await apiRequest<NotesPage>(`/api/v1/notes?${search.toString()}`);
      return response;
    },
  });
}
