import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

// Fetch member balances for a group
export const useBalances = (groupId) => {
  return useQuery({
    queryKey: ["balances", groupId],
    queryFn: async () => {
      if (!groupId) return null;
      const res = await api.get(`/groups/${groupId}/balances`);
      return res.data;
    },
    enabled: !!groupId
  });
};

// Fetch simplified settlement suggestions for a group
export const useSettlementSuggestions = (groupId) => {
  return useQuery({
    queryKey: ["settlements", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const res = await api.get(`/groups/${groupId}/settlements`);
      return res.data;
    },
    enabled: !!groupId
  });
};

// Record a settlement
export const useRecordSettlement = (groupId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settlementData) => {
      const res = await api.post("/settlements", settlementData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
      queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupDashboard", groupId] });
    }
  });
};

// Fetch detailed balance breakdown for a specific user
export const useUserBreakdown = (userId) => {
  return useQuery({
    queryKey: ["userBreakdown", userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await api.get(`/users/${userId}/balance-breakdown`);
      return res.data;
    },
    enabled: !!userId
  });
};
