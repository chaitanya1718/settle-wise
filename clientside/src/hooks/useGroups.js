import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

// Fetch all groups the user is associated with
export const useGroups = () => {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await api.get("/groups");
      return res.data;
    }
  });
};

// Create a new group
export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name) => {
      const res = await api.post("/groups", { name });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    }
  });
};

// Fetch single group details (including membership timeline)
export const useGroupDetails = (groupId) => {
  return useQuery({
    queryKey: ["groups", groupId],
    queryFn: async () => {
      if (!groupId) return null;
      const res = await api.get(`/groups/${groupId}`);
      return res.data;
    },
    enabled: !!groupId
  });
};

// Add a member to a group
export const useAddGroupMember = (groupId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, joinedAt }) => {
      const res = await api.post(`/groups/${groupId}/members`, { userId, joinedAt });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    }
  });
};

// Remove/leave a group member
export const useLeaveGroup = (groupId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ membershipId, leftAt }) => {
      const res = await api.patch(`/groups/${groupId}/members/${membershipId}/leave`, { leftAt });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    }
  });
};

// Fetch all users in the system (for member dropdowns)
export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data;
    }
  });
};

// Fetch group dashboard summary stats
export const useGroupDashboard = (groupId) => {
  return useQuery({
    queryKey: ["groupDashboard", groupId],
    queryFn: async () => {
      if (!groupId) return null;
      const res = await api.get(`/groups/${groupId}/dashboard`);
      return res.data;
    },
    enabled: !!groupId
  });
};
