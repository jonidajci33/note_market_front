import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import type { NoteSummary } from "@/hooks/useNotes";

export function useNoteDetail(id?: string) {
  return useQuery({
    queryKey: ["note", id],
    enabled: Boolean(id),
    queryFn: () => apiRequest<NoteSummary>(`/api/v1/notes/${id}`),
  });
}
