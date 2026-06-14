import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { GroupProvider } from "./contexts/GroupContext";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Balances from "./pages/Balances";
import ImportCsv from "./pages/ImportCsv";
import ImportReview from "./pages/ImportReview";

// Components
import Navbar from "./components/Navbar";

// Create React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

// Protected Route Guard Wrapper
const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-600"></div>
        <span className="ml-3 text-sm text-gray-500 font-semibold">Loading session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} SettleWise. Built with Vite, React Query, and TailwindCSS.
      </footer>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GroupProvider>
          <Router>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/balances" element={<Balances />} />
                <Route path="/import" element={<ImportCsv />} />
                <Route path="/import/review/:jobId" element={<ImportReview />} />
              </Route>

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </GroupProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
