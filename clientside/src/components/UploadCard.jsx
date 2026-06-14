import React, { useState, useRef } from "react";

const UploadCard = ({ onUpload, loading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        alert("Please upload CSV files only.");
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        alert("Please upload CSV files only.");
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <form
        onSubmit={handleSubmit}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleChange}
        />

        <div
          onClick={handleButtonClick}
          className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors duration-150 ${
            dragActive
              ? "border-primary-500 bg-primary-50/50"
              : "border-gray-300 hover:border-primary-400 hover:bg-gray-50/50"
          }`}
        >
          <svg
            className="w-12 h-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm font-semibold text-gray-700 text-center">
            Drag and drop your transaction CSV here
          </p>
          <p className="text-xs text-gray-400 mt-1 text-center">or click to browse from files</p>
        </div>

        {selectedFile && (
          <div className="w-full mt-6 bg-gray-50 border border-gray-150 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 truncate">
              <svg
                className="w-8 h-8 text-primary-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div className="truncate">
                <p className="text-sm font-bold text-gray-800 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">
                  {Math.round(selectedFile.size / 102.4) / 10} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {selectedFile && (
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-150 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Analyzing CSV...</span>
              </>
            ) : (
              <span>Inspect Transactions</span>
            )}
          </button>
        )}
      </form>
    </div>
  );
};

export default UploadCard;
