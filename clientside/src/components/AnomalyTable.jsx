import React from "react";

const AnomalyTable = ({ anomalies, onApprove, onReject, processingId }) => {
  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
        <svg
          className="w-12 h-12 text-green-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h4 className="text-lg font-bold text-gray-950">No Anomalies Found</h4>
        <p className="text-sm text-gray-500 mt-1">This transaction batch is perfectly clean and ready to import!</p>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity.toUpperCase()) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "LOW":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusBadge = (status) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Row</th>
              <th className="px-6 py-3.5">Anomaly Type</th>
              <th className="px-6 py-3.5">Description</th>
              <th className="px-6 py-3.5">Severity</th>
              <th className="px-6 py-3.5">Review Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-gray-700">
            {anomalies.map((a) => {
              const isProcessing = processingId === a.id;
              const isResolved = a.reviewStatus !== "PENDING";
              return (
                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{a.rowNumber}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{a.anomalyType}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs sm:max-w-md truncate">{a.description}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityColor(a.severity)}`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(a.reviewStatus)}`}>
                      {a.reviewStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    {a.reviewStatus !== "APPROVED" && (
                      <button
                        onClick={() => onApprove(a.id)}
                        disabled={isProcessing}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-bold rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {isProcessing ? "..." : "Approve"}
                      </button>
                    )}
                    {a.reviewStatus !== "REJECTED" && (
                      <button
                        onClick={() => onReject(a.id)}
                        disabled={isProcessing}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-bold rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {isProcessing ? "..." : "Reject"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnomalyTable;
