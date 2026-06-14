import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGroup } from "../contexts/GroupContext";
import { useUploadCsv, useImportJobs } from "../hooks/useImports";
import UploadCard from "../components/UploadCard";

const ImportCsv = () => {
  const { selectedGroup } = useGroup();
  const groupId = selectedGroup?.id;
  const navigate = useNavigate();

  const { data: importJobs, isLoading: jobsLoading } = useImportJobs();
  const uploadCsvMutation = useUploadCsv();
  const [errorMsg, setErrorMsg] = useState("");

  const handleUpload = async (file) => {
    setErrorMsg("");
    try {
      const res = await uploadCsvMutation.mutateAsync({ file, groupId });
      // The backend returns a report containing jobId
      if (res && res.jobId) {
        navigate(`/import/review/${res.jobId}`);
      } else {
        setErrorMsg("Failed to retrieve Import Job ID from server.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Failed to analyze CSV file.");
    }
  };

  if (!selectedGroup) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">Import Transactions CSV</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm max-w-xl mx-auto">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <h3 className="text-xl font-bold text-gray-900">No Group Selected</h3>
          <p className="text-sm text-gray-500 mt-2">
            Please select a group in the navbar dropdown first. Transactions inside the CSV will be imported into your active group.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-gray-150 pb-6 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Import Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">Upload a CSV file containing group expenses and settlements to parse them</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6 shadow-sm flex justify-between items-center">
          <span className="text-sm font-semibold">{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-red-600 font-bold">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: CSV Upload area */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-gray-900">Upload CSV File</h3>
          <UploadCard onUpload={handleUpload} loading={uploadCsvMutation.isPending} />
          
          <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-5 text-sm text-primary-900">
            <h4 className="font-bold mb-1">CSV Format Requirements:</h4>
            <p className="text-xs mb-3 text-primary-800">Ensure your CSV contains the following column headers:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-mono text-[11px] bg-white/60 p-3 rounded-lg border border-primary-200/40">
              <div>date (YYYY-MM-DD)</div>
              <div>description</div>
              <div>paid_by (email)</div>
              <div>amount</div>
              <div>currency (e.g. INR)</div>
              <div>split_type (EQUAL/SETTLEMENT)</div>
              <div>split_with (comma emails)</div>
              <div>split_details</div>
              <div>notes</div>
            </div>
          </div>
        </div>

        {/* Right: Previous jobs history list */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-fit">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
            Upload History
          </h3>
          
          {jobsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse h-10 bg-gray-50 rounded-xl"></div>
              ))}
            </div>
          ) : !importJobs || importJobs.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No import jobs recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {importJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/import/review/${job.id}`)}
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-150 hover:border-gray-300 rounded-xl p-3 flex justify-between items-center cursor-pointer transition-all duration-150"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-gray-800 truncate" title={job.fileName}>
                      {job.fileName}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(job.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportCsv;
