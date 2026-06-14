import React, { useState, useEffect } from "react";
import { useGroup } from "../contexts/GroupContext";
import { useBalances, useSettlementSuggestions, useRecordSettlement } from "../hooks/useBalances";
import BalanceCard from "../components/BalanceCard";

const Balances = () => {
  const { selectedGroup } = useGroup();
  const groupId = selectedGroup?.id;

  const { data: balancesData, isLoading: balancesLoading, error: balancesError } = useBalances(groupId);
  const { data: suggestions, isLoading: suggestionsLoading, error: suggestionsError } = useSettlementSuggestions(groupId);
  const recordSettlementMutation = useRecordSettlement(groupId);

  const [payerId, setPayerId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const members = balancesData?.members || [];

  // When suggestions or members change, prefill the settlement form with the first suggestion
  useEffect(() => {
    if (suggestions && suggestions.length > 0) {
      const firstSug = suggestions[0];
      setPayerId(firstSug.from);
      setReceiverId(firstSug.to);
      setAmount(firstSug.amount.toString());
      
      // Attempt to find currency from the group members' records
      const currencyFound = members.find((m) => m.currency)?.currency || "INR";
      setCurrency(currencyFound);
    } else {
      setPayerId("");
      setReceiverId("");
      setAmount("");
    }
  }, [suggestions, members]);

  const handleRecordSettlement = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!payerId || !receiverId) {
      setErrorMsg("Payer and receiver are required.");
      return;
    }

    if (payerId === receiverId) {
      setErrorMsg("Payer and receiver cannot be the same user.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Amount must be a positive number greater than 0.");
      return;
    }

    try {
      await recordSettlementMutation.mutateAsync({
        payerId,
        receiverId,
        amount: parsedAmount,
        currency: currency.toUpperCase().trim()
      });
      setSuccessMsg("Settlement recorded successfully!");
      setAmount("");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Failed to record settlement.");
    }
  };

  const handlePrefill = (sug) => {
    setPayerId(sug.from);
    setReceiverId(sug.to);
    setAmount(sug.amount.toString());
    setErrorMsg("");
    setSuccessMsg("");
  };

  if (!selectedGroup) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">Group Balances</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm max-w-xl mx-auto">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          <h3 className="text-xl font-bold text-gray-900">No Group Selected</h3>
          <p className="text-sm text-gray-500 mt-2">
            Please choose a group in the navbar dropdown to view balances and suggestions.
          </p>
        </div>
      </div>
    );
  }

  // Handle Loading/Error States
  if (balancesLoading || suggestionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-600"></div>
        <span className="ml-3 text-sm text-gray-500 font-semibold">Calculating balances...</span>
      </div>
    );
  }

  // Handle Mixed Currencies block
  if (balancesError?.response?.data?.message || suggestionsError?.response?.data?.message) {
    const mixedMsg = balancesError?.response?.data?.message || suggestionsError?.response?.data?.message;
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-6 shadow-sm">
          <div className="flex">
            <svg className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-lg font-bold">Mixed Currencies Detected</h3>
              <p className="text-sm mt-1">{mixedMsg}</p>
              <p className="text-xs text-amber-700 mt-2">
                Tip: Clean up expenses of differing currencies or apply conversions to unify the group baseline.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (balancesError || suggestionsError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold">Error Loading Balances</h3>
          <p className="text-sm mt-1">{balancesError?.message || suggestionsError?.message}</p>
        </div>
      </div>
    );
  }

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
      <div className="border-b border-gray-150 pb-6 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Balances</h1>
        <p className="text-sm text-gray-500 mt-1">Paid vs owed summaries and greedy debt settlements for {selectedGroup.name}</p>
      </div>

      {/* Grid: Balances List */}
      <h3 className="text-lg font-bold text-gray-900 mb-4">Member Balances</h3>
      {members.length === 0 ? (
        <p className="text-sm text-gray-500 mb-8">No members are in this group yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {members.map((member) => (
            <BalanceCard key={member.userId} member={member} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Suggestions */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Settlement Suggestions (Greedy Simplification)</h3>
          
          {suggestions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-150 p-8 text-center shadow-sm">
              <svg className="w-10 h-10 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-base font-bold text-gray-950">Perfect Balance!</h4>
              <p className="text-xs text-gray-400 mt-1">All members are perfectly settled up. No transfers needed!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  onClick={() => handlePrefill(sug)}
                  className="bg-white border border-gray-200 hover:border-primary-400 hover:bg-gray-50/30 rounded-xl p-4 flex justify-between items-center shadow-sm cursor-pointer transition-colors duration-150"
                  title="Click to prefill settlement form"
                >
                  <div className="flex items-center space-x-3 text-sm text-gray-700">
                    <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs">Owes</span>
                    <span className="font-bold text-gray-900">{sug.fromName}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="font-bold text-gray-950">{sug.toName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-primary-600">{sug.amount.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">{currency}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Record Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-fit">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
            Record a Settlement
          </h3>
          
          <form onSubmit={handleRecordSettlement} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Who Paid (Debtor)</label>
              <select
                required
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
              >
                <option value="">-- Choose Debtor --</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Who Received (Creditor)</label>
              <select
                required
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
              >
                <option value="">-- Choose Creditor --</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Currency</label>
                <input
                  type="text"
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 text-sm uppercase"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={recordSettlementMutation.isPending}
              className="w-full mt-2 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-sm text-sm transition-colors duration-150 disabled:opacity-50"
            >
              {recordSettlementMutation.isPending ? "Recording..." : "Record Settlement"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Balances;
