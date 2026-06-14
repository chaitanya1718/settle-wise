import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

// Fetch expenses for a group
export const useExpenses = (groupId) => {
  return useQuery({
    queryKey: ["expenses", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const res = await api.get(`/groups/${groupId}/expenses`);
      return res.data;
    },
    enabled: !!groupId
  });
};

// Create a new expense
export const useCreateExpense = (groupId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expenseData) => {
      const res = await api.post("/expenses", expenseData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
      queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupDashboard", groupId] });
    }
  });
};

// Delete an expense
export const useDeleteExpense = (groupId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expenseId) => {
      const res = await api.delete(`/expenses/${expenseId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
      queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupDashboard", groupId] });
    }
  });
};
