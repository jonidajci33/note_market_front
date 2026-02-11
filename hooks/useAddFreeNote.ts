import { useMutation } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export function useAddFreeNote(noteId?: string) {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: async () => {
      if (!noteId) throw new Error("Missing note id");
      // Using download endpoint to grant entitlement for free notes
      return apiRequest(`/api/v1/notes/${noteId}/download`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
  });
}
