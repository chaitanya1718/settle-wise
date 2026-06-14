import React from "react";

const ExpenseCard = ({ expense }) => {
  const { title, description, amount, currency, splitType, expenseDate, payer, participants } = expense;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Card Header */}
      <div className="p-5 border-b border-gray-50 bg-gray-50/50">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-xl font-extrabold text-primary-600 block">
              {parseFloat(amount).toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {currency}
            </span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Paid By</span>
            <span className="font-semibold text-gray-800">{payer ? payer.name : "Unknown"}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Date</span>
            <span className="font-semibold text-gray-800">{formatDate(expenseDate)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Split Type</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 mt-0.5">
              {splitType}
            </span>
          </div>
        </div>

        {/* Participants shares */}
        {participants && participants.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider mb-2">Participant Shares</span>
            <div className="space-y-1.5">
              {participants.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-sm text-gray-700">
                  <span className="font-medium">{p.user ? p.user.name : "Member"}</span>
                  <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                    {parseFloat(p.shareAmount).toFixed(2)} {currency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCard;
