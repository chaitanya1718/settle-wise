import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

// Fetch all import jobs
export const useImportJobs = () => {
  return useQuery({
    queryKey: ["importJobs"],
    queryFn: async () => {
      const res = await api.get("/import/jobs");
      return res.data;
    }
  });
};

// Fetch single import job details and anomalies
export const useImportJobDetails = (jobId) => {
  return useQuery({
    queryKey: ["importJob", jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await api.get(`/import/jobs/${jobId}`);
      return res.data;
    },
    enabled: !!jobId
  });
};

// Approve a specific anomaly
export const useApproveAnomaly = (jobId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (anomalyId) => {
      const res = await api.patch(`/import/anomalies/${anomalyId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["importJob", jobId] });
    }
  });
};

// Reject a specific anomaly
export const useRejectAnomaly = (jobId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (anomalyId) => {
      const res = await api.patch(`/import/anomalies/${anomalyId}/reject`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["importJob", jobId] });
    }
  });
};

// Execute the final import job
export const useExecuteImportJob = (jobId, groupId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/import/jobs/${jobId}/execute`, { groupId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["importJobs"] });
      queryClient.invalidateQueries({ queryKey: ["importJob", jobId] });
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
      queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupDashboard", groupId] });
    }
  });
};

// Upload CSV file (requires multipart/form-data)
export const useUploadCsv = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, groupId }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("groupId", groupId);

      const res = await api.post("/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["importJobs"] });
    }
  });
};
