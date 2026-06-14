import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroup } from "../contexts/GroupContext";
import {
  useImportJobDetails,
  useApproveAnomaly,
  useRejectAnomaly,
  useExecuteImportJob
} from "../hooks/useImports";
import AnomalyTable from "../components/AnomalyTable";

const ImportReview = () => {
  const { jobId } = useParams();
  const { selectedGroup } = useGroup();
  const groupId = selectedGroup?.id;
  const navigate = useNavigate();

  const { data: jobData, isLoading: jobLoading, error: jobError } = useImportJobDetails(jobId);
  const approveMutation = useApproveAnomaly(jobId);
  const rejectMutation = useRejectAnomaly(jobId);
  const executeMutation = useExecuteImportJob(jobId, groupId);

  const [processingId, setProcessingId] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const job = jobData?.job;
  const anomalies = jobData?.anomalies || [];

  const handleApprove = async (anomalyId) => {
    setProcessingId(anomalyId);
    setErrorMsg("");
    try {
      await approveMutation.mutateAsync(anomalyId);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to approve anomaly.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (anomalyId) => {
    setProcessingId(anomalyId);
    setErrorMsg("");
    try {
      await rejectMutation.mutateAsync(anomalyId);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to reject anomaly.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleExecuteImport = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setExecutionResult(null);

    if (!groupId) {
      setErrorMsg("No active group selected. Please select a group in the navbar before execution.");
      return;
    }

    // Client-side verification
    const pendingHighMedium = anomalies.filter(
      (a) => (a.severity === "HIGH" || a.severity === "MEDIUM") && a.reviewStatus === "PENDING"
    );

    if (pendingHighMedium.length > 0) {
      setErrorMsg(
        `Cannot execute import yet: ${pendingHighMedium.length} HIGH or MEDIUM severity anomalies are still pending review. Please Approve or Reject them.`
      );
      return;
    }

    try {
      const res = await executeMutation.mutateAsync();
      setExecutionResult(res);
      setSuccessMsg("CSV Import executed successfully!");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Failed to execute CSV import.");
    }
  };

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-600"></div>
        <span className="ml-3 text-sm text-gray-500 font-semibold">Loading import review report...</span>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold">Error Loading Import Job</h3>
          <p className="text-sm mt-1">{jobError?.message || "Import job not found."}</p>
          <button
            onClick={() => navigate("/import")}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-primary-700 bg-primary-100 hover:bg-primary-200"
          >
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const pendingCount = anomalies.filter((a) => a.reviewStatus === "PENDING").length;
  const approvedCount = anomalies.filter((a) => a.reviewStatus === "APPROVED").length;
  const rejectedCount = anomalies.filter((a) => a.reviewStatus === "REJECTED").length;

  const pendingHighMediumCount = anomalies.filter(
    (a) => (a.severity === "HIGH" || a.severity === "MEDIUM") && a.reviewStatus === "PENDING"
  ).length;

  const isExecutionBlocked = pendingHighMediumCount > 0 || job.status !== "PENDING";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Messages */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 mb-6 flex justify-between items-center shadow-sm">
          <span className="text-sm font-semibold">{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-green-600 hover:text-green-800 font-bold">×</button>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6 flex justify-between items-center shadow-sm">
          <span className="text-sm font-semibold">{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-red-600 hover:text-red-800 font-bold">×</button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-150 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Import Review</h1>
          <p className="text-sm text-gray-500 mt-1">
            Job ID: {job.id} • Target Group: {selectedGroup ? selectedGroup.name : "None Selected"}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate("/import")}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 bg-white shadow-sm"
          >
            Back to Uploads
          </button>
          
          {job.status === "PENDING" && (
            <button
              onClick={handleExecuteImport}
              disabled={isExecutionBlocked || executeMutation.isPending}
              className={`px-4 py-2 text-white font-bold rounded-xl text-sm shadow-sm transition-colors ${
                isExecutionBlocked
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              }`}
              title={pendingHighMediumCount > 0 ? "Resolve pending anomalies first" : "Import approved transactions"}
            >
              {executeMutation.isPending ? "Executing Import..." : "Execute Import"}
            </button>
          )}
        </div>
      </div>

      {/* Summary report panel */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-50 pb-2">Import Report Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">File Name</span>
            <span className="font-bold text-gray-800 truncate block mt-0.5" title={job.fileName}>{job.fileName}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Job Status</span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold mt-1 ${
                job.status === "COMPLETED"
                  ? "bg-green-100 text-green-800"
                  : job.status === "FAILED"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {job.status}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Anomalies Detected</span>
            <span className="font-bold text-gray-900 block mt-0.5">{anomalies.length} total</span>
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Review Pipeline</span>
            <span className="text-xs text-gray-500 block mt-0.5">
              {pendingCount} Pending • {approvedCount} Approved • {rejectedCount} Rejected
            </span>
          </div>
        </div>
      </div>

      {/* Execution Results Summary display */}
      {executionResult && (
        <div className="bg-green-50 border border-green-200 text-green-950 rounded-2xl p-6 shadow-sm mb-8">
          <h3 className="text-lg font-bold flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Import Executed Successfully
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm font-semibold">
            <div className="bg-white/60 p-3 rounded-xl border border-green-100">
              <span className="text-xs text-green-700 block uppercase font-bold tracking-wider">Rows Imported</span>
              <span className="text-xl font-extrabold text-green-900 mt-1 block">{executionResult.importedRows}</span>
            </div>
            <div className="bg-white/60 p-3 rounded-xl border border-green-100">
              <span className="text-xs text-green-700 block uppercase font-bold tracking-wider">Rows Ignored</span>
              <span className="text-xl font-extrabold text-gray-700 mt-1 block">{executionResult.ignoredRows}</span>
            </div>
            <div className="bg-white/60 p-3 rounded-xl border border-green-100">
              <span className="text-xs text-green-700 block uppercase font-bold tracking-wider">Expenses Created</span>
              <span className="text-xl font-extrabold text-primary-700 mt-1 block">{executionResult.importedExpenses}</span>
            </div>
            <div className="bg-white/60 p-3 rounded-xl border border-green-100">
              <span className="text-xs text-green-700 block uppercase font-bold tracking-wider">Settlements Recorded</span>
              <span className="text-xl font-extrabold text-indigo-700 mt-1 block">{executionResult.importedSettlements}</span>
            </div>
          </div>
        </div>
      )}

      {/* Anomalies Table Section */}
      <h3 className="text-xl font-extrabold text-gray-900 mb-4">Anomalies Review Table</h3>
      {anomalies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-sm max-w-xl mx-auto">
          <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-950">No Anomalies Found</h3>
          <p className="text-sm text-gray-500 mt-1">
            This transaction batch is perfectly clean and ready to import!
          </p>
        </div>
      ) : (
        <AnomalyTable
          anomalies={anomalies}
          onApprove={handleApprove}
          onReject={handleReject}
          processingId={processingId}
        />
      )}
    </div>
  );
};

export default ImportReview;
