import React, { useState } from "react";
import { useGroup } from "../contexts/GroupContext";
import { useExpenses, useCreateExpense, useDeleteExpense } from "../hooks/useExpenses";
import { useGroupDetails } from "../hooks/useGroups";
import ExpenseCard from "../components/ExpenseCard";

const Expenses = () => {
  const { selectedGroup } = useGroup();
  const groupId = selectedGroup?.id;

  const { data: expenses, isLoading: expensesLoading, error: expensesError } = useExpenses(groupId);
  const { data: details, isLoading: detailsLoading } = useGroupDetails(groupId);
  const createExpenseMutation = useCreateExpense(groupId);
  const deleteExpenseMutation = useDeleteExpense(groupId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [payerId, setPayerId] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState({});
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const activeMembers = details?.memberships?.filter((m) => m.leftAt === null) || [];

  const handleOpenModal = () => {
    if (activeMembers.length === 0) {
      alert("This group has no members. Add members on the Dashboard page first.");
      return;
    }
    // Default values
    setTitle("");
    setDescription("");
    setAmount("");
    setCurrency("INR");
    setPayerId(activeMembers[0]?.userId || "");
    
    // Select all active members as participants by default
    const participantsObj = {};
    activeMembers.forEach((m) => {
      participantsObj[m.userId] = true;
    });
    setSelectedParticipants(participantsObj);

    setErrorMsg("");
    setSuccessMsg("");
    setShowAddModal(true);
  };

  const handleToggleParticipant = (userId) => {
    setSelectedParticipants((prev) => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense? This will recalculate group balances.")) return;
    try {
      await deleteExpenseMutation.mutateAsync(expenseId);
      setSuccessMsg("Expense deleted successfully.");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to delete expense.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!title.trim()) {
      setErrorMsg("Expense title is required.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Amount must be a positive number greater than 0.");
      return;
    }

    if (!payerId) {
      setErrorMsg("Please select the user who paid.");
      return;
    }

    // Filter participant IDs that are checked
    const participantIds = Object.keys(selectedParticipants).filter(
      (uid) => selectedParticipants[uid]
    );

    if (participantIds.length === 0) {
      setErrorMsg("At least one participant must be selected for the split.");
      return;
    }

    const expensePayload = {
      title: title.trim(),
      description: description.trim() || null,
      amount: parsedAmount,
      currency: currency.toUpperCase().trim(),
      splitType: "EQUAL",
      expenseDate: new Date(expenseDate).toISOString(),
      payerId,
      groupId,
      participants: participantIds.map((uid) => ({ userId: uid }))
    };

    try {
      await createExpenseMutation.mutateAsync(expensePayload);
      setSuccessMsg("Expense recorded successfully!");
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Failed to create expense.");
    }
  };

  if (!selectedGroup) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">Group Expenses</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm max-w-xl mx-auto">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold text-gray-900">No Group Selected</h3>
          <p className="text-sm text-gray-500 mt-2">
            Please choose a group in the navbar dropdown to view or record expenses.
          </p>
        </div>
      </div>
    );
  }

  if (expensesLoading || detailsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-600"></div>
        <span className="ml-3 text-sm text-gray-500 font-semibold">Loading expenses...</span>
      </div>
    );
  }

  if (expensesError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold">Error Loading Expenses</h3>
          <p className="text-sm mt-1">{expensesError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Alert Banner */}
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
      <div className="flex justify-between items-center mb-8 border-b border-gray-150 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Timeline of all transactions in {selectedGroup.name}</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          Record Expense
        </button>
      </div>

      {/* Expense Grid */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm max-w-xl mx-auto">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-bold text-gray-950">No Expenses Recorded</h3>
          <p className="text-sm text-gray-500 mt-1">
            Tap the button above to add the group's very first split expense!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {expenses.map((expense) => (
            <div key={expense.id} className="relative group/card">
              <ExpenseCard expense={expense} />
              <button
                onClick={() => handleDeleteExpense(expense.id)}
                className="absolute top-3 right-3 opacity-0 group-hover/card:opacity-100 p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-opacity duration-150 shadow"
                title="Delete Expense"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Record Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-base font-bold text-gray-900">Record Split Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dinner, Taxi, Groceries"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  placeholder="e.g. Spent at Italian restaurant"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 sm:text-sm h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Currency</label>
                  <input
                    type="text"
                    required
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 sm:text-sm uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Paid By</label>
                  <select
                    required
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                  >
                    {activeMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Split With (Participants)</label>
                <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 space-y-2">
                  {activeMembers.map((m) => (
                    <label key={m.userId} className="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selectedParticipants[m.userId]}
                        onChange={() => handleToggleParticipant(m.userId)}
                        className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                      />
                      <span>{m.user.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50"
                >
                  {createExpenseMutation.isPending ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
