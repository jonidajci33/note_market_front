import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";

export type Category = {
  id: string;
  slug: string;
  name: string;
};

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiRequest<Category[]>("/api/v1/categories");
      if (!Array.isArray(response)) {
        return [];
      }
      return response.filter(
        (c): c is Category => typeof c.id === "string" && typeof c.name === "string" && typeof c.slug === "string",
      );
    },
  });
}
