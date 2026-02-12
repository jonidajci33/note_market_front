import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

type OrderCreateResponse = {
  id: string;
};

export function useAddFreeNote(noteId?: string) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!noteId) throw new Error("Missing note id");
      if (!token) throw new Error("You must be logged in to add notes.");

      // Free notes still require commerce entitlement grant through order payment.
      const order = await apiRequest<OrderCreateResponse>("/api/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [{ itemType: "NOTE", itemId: noteId }],
        }),
      });

      return apiRequest(`/api/v1/orders/${order.id}/pay`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}
