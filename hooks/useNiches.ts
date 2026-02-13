import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";

export type Niche = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
};

export function useNiches(categoryId?: string) {
  const path = categoryId ? `/api/v1/niches?categoryId=${categoryId}` : "/api/v1/niches";
  return useQuery({
    queryKey: ["niches", categoryId ?? "all"],
    queryFn: async () => {
      const response = await apiRequest<Niche[]>(path);
      if (!Array.isArray(response)) {
        return [];
      }
      return response.filter(
        (n): n is Niche => typeof n.id === "string" && typeof n.name === "string" && typeof n.slug === "string",
      );
    },
  });
}
