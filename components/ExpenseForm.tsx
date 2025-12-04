import React, { useState, useRef, useEffect } from 'react';
import { User, SplitType, PaymentMethod, Expense } from '../types';
import { USERS, CATEGORIES } from '../constants';
import { CreditCard, Wallet, CheckCircle } from 'lucide-react';

interface ExpenseFormProps {
  onSubmit: (data: any, installments: number) => void;
  onUpdate?: (data: Expense) => void;
  onCancel: () => void;
  initialData?: Expense;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSubmit, onUpdate, onCancel, initialData }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [payerId, setPayerId] = useState(USERS[0].id);
  const [splitType, setSplitType] = useState<SplitType>(SplitType.EQUAL);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT);
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setDescription(initialData.description);
      setCategory(initialData.category);
      setPayerId(initialData.payerId);
      setSplitType(initialData.splitType);
      setDate(initialData.date);
      setPaymentMethod(initialData.paymentMethod);
      setNotes(initialData.notes || '');
      setInstallments(1); // Editing individual records usually doesn't involve changing installments count
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    if (initialData && onUpdate) {
      onUpdate({
        ...initialData,
        amount: parseFloat(amount),
        description,
        category,
        payerId,
        splitType,
        date,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
    } else {
      onSubmit({
        amount: parseFloat(amount),
        description,
        category,
        payerId,
        splitType,
        date,
        paymentMethod,
        notes: notes.trim() || undefined,
      }, installments);

      // Reset form fields for new entry only if NOT editing
      setAmount('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      setInstallments(1);
      setNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const isEditing = !!initialData;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
          {isEditing ? 'Edit Expense' : 'Add Expense'}
        </h3>
        {showSuccess && (
          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in slide-in-from-right duration-300">
            <CheckCircle className="w-3 h-3" /> Saved!
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
            {isEditing ? 'Amount ($)' : 'Total Amount ($)'}
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg font-semibold"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="What was this for?"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Date {isEditing ? '' : 'of 1st Payment'}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            >
              {CATEGORIES.map((c: any) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {!isEditing && (
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Instalments (Months)</label>
                  <input
                      type="number"
                      min="1"
                      max="60"
                      step="1"
                      value={installments}
                      onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                      className="w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
              </div>
              <div>
                  {/* Spacer or additional field if needed */}
              </div>
          </div>
        )}

        <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Method</label>
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg h-[46px]">
                <button
                    type="button"
                    onClick={() => setPaymentMethod(PaymentMethod.CREDIT)}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-md text-sm font-medium transition-all ${
                        paymentMethod === PaymentMethod.CREDIT
                            ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    <CreditCard className="w-3 h-3" />
                    Credit
                </button>
                <button
                    type="button"
                    onClick={() => setPaymentMethod(PaymentMethod.DEBIT)}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-md text-sm font-medium transition-all ${
                        paymentMethod === PaymentMethod.DEBIT
                            ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    <Wallet className="w-3 h-3" />
                    Debit
                </button>
             </div>
        </div>

        {!isEditing && installments > 1 && (
             <p className="text-xs text-slate-400 mt-[-8px]">
               Monthly: ${(parseFloat(amount || '0') / installments).toFixed(2)} x {installments} months.
             </p>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Paid By</label>
          <div className="flex gap-2">
            {USERS.map((user: any) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setPayerId(user.id)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  payerId === user.id
                    ? `${user.color.replace('bg-', 'bg-')} text-white shadow-md`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Split</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSplitType(SplitType.EQUAL)}
              className={`py-3 px-4 rounded-lg font-medium text-sm transition-all border ${
                splitType === SplitType.EQUAL
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Split 50/50
            </button>
            <button
              type="button"
              onClick={() => setSplitType(SplitType.FULL_FOR_OTHER)}
              className={`py-3 px-4 rounded-lg font-medium text-sm transition-all border ${
                splitType === SplitType.FULL_FOR_OTHER
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Full for Other
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            {splitType === SplitType.EQUAL 
              ? `You paid $${amount || '0'}, they owe $${amount ? (parseFloat(amount)/2).toFixed(2) : '0'}`
              : `You paid $${amount || '0'}, they owe $${amount || '0'}`
            }
            {installments > 1 && !isEditing && ' (Total)'}
          </p>
        </div>

        <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Notes</label>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-20"
                placeholder="Optional details..."
            />
        </div>

        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-lg bg-slate-900 dark:bg-slate-700 text-white font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors shadow-lg"
          >
            {isEditing ? 'Update Expense' : 'Save Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};