import React from 'react';
import { ExpenseSummary, User } from '../types';
import { USERS } from '../constants';
import { Wallet, ArrowRightLeft, CheckCircle, CalendarClock } from 'lucide-react';

interface BalanceCardProps {
  summary: ExpenseSummary;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ summary }) => {
  const { netBalance } = summary;
  const isSettled = Math.abs(netBalance) < 0.01;
  
  // netBalance > 0: B owes A
  // netBalance < 0: A owes B
  const debtor = netBalance > 0 ? USERS[1] : USERS[0];
  const creditor = netBalance > 0 ? USERS[0] : USERS[1];
  const absAmount = Math.abs(netBalance);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl mb-6 border border-transparent dark:border-slate-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
            Current Month Balance
          </h2>
          <div className="text-3xl font-bold mt-1 flex items-baseline">
            {isSettled ? (
              <span>$0.00</span>
            ) : (
              <span>${absAmount.toFixed(2)}</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
             <CalendarClock className="w-3 h-3" />
             Excludes future installments
          </div>
        </div>
        <div className="p-2 bg-slate-700/50 rounded-lg">
          <Wallet className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {isSettled ? (
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 p-3 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">All settled for this month!</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className={`font-bold ${debtor.id === USERS[0].id ? 'text-emerald-400' : 'text-blue-400'}`}>
              {debtor.name}
            </span>
            <span>owes</span>
            <span className={`font-bold ${creditor.id === USERS[0].id ? 'text-emerald-400' : 'text-blue-400'}`}>
              {creditor.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};