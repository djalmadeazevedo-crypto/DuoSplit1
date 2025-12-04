import React, { useState } from 'react';
import { Expense, SplitType, PaymentMethod } from '../types';
import { USERS } from '../constants';
import { Trash2, CreditCard, Wallet, StickyNote, AlertCircle, Pencil, CheckCircle2 } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete, onEdit }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💸</span>
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No expenses yet</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Add your first expense to start tracking.</p>
      </div>
    );
  }

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId === id) {
      onDelete(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => {
        setDeletingId(prev => prev === id ? null : prev);
      }, 3000);
    }
  };

  return (
    <div className="space-y-3 pb-24">
      {expenses.map((expense) => {
        const payer = USERS.find(u => u.id === expense.payerId);
        const debtor = USERS.find(u => u.id !== expense.payerId);
        const amount = expense.amount;
        const owes = expense.splitType === SplitType.EQUAL ? amount / 2 : amount;
        
        const dateDisplay = new Date(expense.date + 'T12:00:00')
            .toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        return (
          <div key={expense.id} className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 group transition-colors relative ${expense.isSettled ? 'opacity-75 grayscale-[0.5]' : ''}`}>
            {expense.isSettled && (
                 <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold z-20">
                     <CheckCircle2 className="w-3 h-3" /> Settled
                 </div>
            )}
            
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      {dateDisplay}
                    </span>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                      {expense.category}
                    </span>
                    {expense.paymentMethod === PaymentMethod.CREDIT ? (
                        <CreditCard className="w-3 h-3 text-slate-400" />
                    ) : (
                        <Wallet className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{expense.description}</h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <span>{debtor?.name} owes ${owes.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 ml-4 shrink-0 mt-6">
                  <div className="text-right">
                    <span className="block text-xs text-slate-400">Amount</span>
                    <span className={`block font-bold ${expense.payerId === USERS[0].id ? 'text-emerald-500' : 'text-blue-500'}`}>
                      ${amount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(expense);
                        }}
                        className="relative z-10 p-2 rounded-full transition-all duration-200 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:text-slate-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>

                    <button 
                        onClick={(e) => handleDeleteClick(e, expense.id)}
                        className={`relative z-10 p-2 rounded-full transition-all duration-200 ${
                            deletingId === expense.id 
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 w-auto px-3' 
                            : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-900/20'
                        }`}
                    >
                        {deletingId === expense.id ? (
                            <span className="text-xs font-bold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Confirm?
                            </span>
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                  </div>
                </div>
            </div>
            {expense.notes && (
                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 flex gap-2 items-start text-xs text-slate-500 dark:text-slate-400">
                    <StickyNote className="w-3 h-3 mt-0.5 opacity-50" />
                    <p className="italic">{expense.notes}</p>
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
};