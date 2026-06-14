import React from "react";

const BalanceCard = ({ member }) => {
  const { name, email, paid, owed, net } = member;

  const isCreditor = net > 0.005;
  const isDebtor = net < -0.005;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
      <div>
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-base font-bold text-gray-900 tracking-tight">{name}</h4>
            <p className="text-xs text-gray-500 truncate w-36 sm:w-48">{email}</p>
          </div>
          <div className="text-right">
            {isCreditor && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                Owed Money
              </span>
            )}
            {isDebtor && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                Owes Money
              </span>
            )}
            {!isCreditor && !isDebtor && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                Settled
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 border-t border-gray-50 pt-4 text-sm">
          <div>
            <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Paid</span>
            <span className="font-semibold text-gray-700">{parseFloat(paid).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Owed</span>
            <span className="font-semibold text-gray-700">{parseFloat(owed).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
        <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Net Balance</span>
        <span
          className={`text-lg font-extrabold ${
            isCreditor ? "text-green-600" : isDebtor ? "text-red-600" : "text-gray-600"
          }`}
        >
          {isCreditor ? "+" : ""}
          {parseFloat(net).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default BalanceCard;
