import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";

export type Niche = {
  id: string;
  slug: string;
  name: string;
  parentId?: string | null;
};

export function useNiches() {
  return useQuery({
    queryKey: ["niches"],
    queryFn: async () => {
      const response = await apiRequest<Niche[]>("/api/v1/niches");
      if (!Array.isArray(response)) {
        return [];
      }
      return response.filter((n): n is Niche => typeof n.id === "string" && typeof n.name === "string" && typeof n.slug === "string");
    },
  });
}
