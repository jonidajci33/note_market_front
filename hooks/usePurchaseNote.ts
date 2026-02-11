import { useMutation } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export function usePurchaseNote(noteId?: string) {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: async () => {
      if (!noteId) throw new Error("Missing note id");
      const order = await apiRequest<{ id: string }>("/api/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [{ itemType: "NOTE", itemId: noteId }],
        }),
      });
      const orderId = (order as any)?.id ?? order;
      return apiRequest(`/api/v1/orders/${orderId}/pay`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
  });
}
