import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";

export type NoteSummary = {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  price?: number | null;
  tags?: string[] | null;
  [key: string]: unknown;
};

export type NotesPage = {
  content: NoteSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

type NotesApiResponse = NotesPage | NoteSummary[];

export type NotesQueryParams = {
  nicheId?: string;
  sellerId?: string;
  q?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "CREATED_AT_DESC" | "PRICE_ASC" | "PRICE_DESC";
  page?: number;
  size?: number;
};

function toNotesPath(params: NotesQueryParams): string {
  const search = new URLSearchParams();

  if (params.nicheId) {
    search.set("nicheId", params.nicheId);
  }

  if (params.sellerId) {
    search.set("sellerId", params.sellerId);
  }

  if (params.q && params.q.trim().length > 0) {
    search.set("q", params.q.trim());
  }

  if (Array.isArray(params.tags)) {
    for (const tag of params.tags) {
      const normalized = tag.trim();

      if (normalized.length > 0) {
        search.append("tags", normalized);
      }
    }
  }

  if (typeof params.minPrice === "number") {
    search.set("minPrice", String(params.minPrice));
  }

  if (typeof params.maxPrice === "number") {
    search.set("maxPrice", String(params.maxPrice));
  }

  if (params.sort) {
    search.set("sort", params.sort);
  }

  if (typeof params.page === "number") {
    search.set("page", String(params.page));
  }

  if (typeof params.size === "number") {
    search.set("size", String(params.size));
  }

  const query = search.toString();

  return query ? `/api/v1/notes?${query}` : "/api/v1/notes";
}

function normalizeNotes(payload: NotesApiResponse): NotesPage {
  if (Array.isArray(payload)) {
    return {
      content: payload,
      page: 0,
      size: payload.length,
      totalElements: payload.length,
      totalPages: 1,
    };
  }

  return {
    content: Array.isArray(payload.content) ? payload.content : [],
    page: typeof payload.page === "number" ? payload.page : 0,
    size: typeof payload.size === "number" ? payload.size : 0,
    totalElements: typeof payload.totalElements === "number" ? payload.totalElements : 0,
    totalPages: typeof payload.totalPages === "number" ? payload.totalPages : 0,
  };
}

export function useNotes(params: NotesQueryParams) {
  return useQuery({
    queryKey: ["notes", params],
    queryFn: async () => {
      const response = await apiRequest<NotesApiResponse>(toNotesPath(params));
      return normalizeNotes(response);
    },
    enabled: true,
  });
}
