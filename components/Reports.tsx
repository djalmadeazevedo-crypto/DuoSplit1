import React, { useState, useMemo, useRef } from 'react';
import { Expense, SplitType } from '../types';
import { ExpenseList } from './ExpenseList';
import { USERS, CATEGORIES } from '../constants';
import { jsPDF } from "jspdf";
import { ArrowDown, ArrowUp, Download, Upload, Trash2, FileText, ArrowRightLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ReportsProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  onImport: (data: Expense[]) => void;
  onReset: () => void;
  onSettle: (month: string) => void;
}

// Helper to convert hex color to RGB for jsPDF
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

export const Reports: React.FC<ReportsProps> = ({ expenses, onDelete, onEdit, onImport, onReset, onSettle }) => {
  // Default to current month: YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7);
  });
  const [selectedCategory, setSelectedCategory] = useState('All');

  // State for confirmation modals
  const [importCandidate, setImportCandidate] = useState<Expense[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showSettleConfirm, setShowSettleConfirm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchMonth = expense.date.startsWith(selectedMonth);
      const matchCategory = selectedCategory === 'All' || expense.category === selectedCategory;
      return matchMonth && matchCategory;
    });
  }, [expenses, selectedMonth, selectedCategory]);

  const monthlySummary = useMemo(() => {
    let totalPaidA = 0;
    let totalPaidB = 0;
    let netBalance = 0;

    filteredExpenses.forEach(exp => {
      // Calculate totals for history regardless of settled status
      if (exp.payerId === USERS[0].id) {
        totalPaidA += exp.amount;
      } else {
        totalPaidB += exp.amount;
      }

      // SKIP settled expenses for the net balance calculation
      if (exp.isSettled) return;

      const amount = exp.amount;
      const isPayerA = exp.payerId === USERS[0].id;

      if (isPayerA) {
        if (exp.splitType === SplitType.EQUAL) {
          netBalance += (amount / 2);
        } else {
          netBalance += amount;
        }
      } else {
        if (exp.splitType === SplitType.EQUAL) {
          netBalance -= (amount / 2);
        } else {
          netBalance -= amount;
        }
      }
    });

    return { totalPaidA, totalPaidB, netBalance };
  }, [filteredExpenses]);

  // Chart Data Preparation
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value) // Highest first
      .filter(item => item.value > 0);
  }, [filteredExpenses]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  const chartHeight = Math.max(categoryData.length * 50, 300);

  const handleSettleClick = () => {
      const unsettledCount = filteredExpenses.filter(e => !e.isSettled).length;
      if (unsettledCount === 0) {
          alert("All expenses for this month are already settled.");
          return;
      }
      // Open custom modal instead of using window.confirm
      setShowSettleConfirm(true);
  };

  const confirmSettle = () => {
      onSettle(selectedMonth);
      setShowSettleConfirm(false);
  };

  const handleDownloadBackup = () => {
      const dataStr = JSON.stringify(expenses, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `duosplit_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleGeneratePDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const title = selectedCategory === 'All' 
        ? `Monthly Report: ${selectedMonth}` 
        : `Monthly Report: ${selectedMonth} (${selectedCategory})`;
      doc.text(title, 14, 15);
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);

      let balanceText = "All Settled";
      // Only show balance calculation if NOT settled
      if (Math.abs(monthlySummary.netBalance) >= 0.01) {
        const debtor = monthlySummary.netBalance > 0 ? USERS[1].name : USERS[0].name;
        const creditor = monthlySummary.netBalance > 0 ? USERS[0].name : USERS[1].name;
        const amount = Math.abs(monthlySummary.netBalance).toFixed(2);
        balanceText = `${debtor} owes ${creditor} $${amount}`;
      }
      
      doc.text(balanceText, 14, 24);

      let y = 35;

      if (categoryData.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Category Breakdown", 14, y);
        y += 8;

        const maxVal = Math.max(...categoryData.map(d => d.value));
        const chartMaxWidth = 90; 
        const startXLabel = 14;
        const startXBar = 60; 

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        categoryData.forEach((cat, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }

          doc.setTextColor(80, 80, 80);
          doc.text(cat.name, startXLabel, y);

          const barWidth = (cat.value / maxVal) * chartMaxWidth;
          const colorHex = COLORS[index % COLORS.length];
          const [r, g, b] = hexToRgb(colorHex);
          
          doc.setFillColor(r, g, b);
          doc.rect(startXBar, y - 3, barWidth, 4, 'F');

          doc.setTextColor(0, 0, 0);
          doc.text(`$${cat.value.toFixed(2)}`, startXBar + barWidth + 2, y);

          y += 6; 
        });

        y += 10;
      }

      if (y + 10 > 280) {
          doc.addPage();
          y = 20;
      }
      
      doc.setFillColor(240, 240, 240);
      doc.rect(14, y - 5, 182, 6, 'F');
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      
      doc.text("DATE", 14, y - 1);
      doc.text("AMOUNT", 42, y - 1, { align: "right" });
      doc.text("DESCRIPTION", 46, y - 1);
      doc.text("CATEGORY", 130, y - 1);
      doc.text("PAYER", 175, y - 1);

      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9); 
      doc.setTextColor(0, 0, 0);

      filteredExpenses.forEach((exp, index) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
          doc.setFont("helvetica", "bold");
          doc.setTextColor(80, 80, 80);
          doc.text("DATE", 14, y);
          doc.text("AMOUNT", 42, y, { align: "right" });
          doc.text("DESCRIPTION", 46, y);
          doc.text("CATEGORY", 130, y);
          doc.text("PAYER", 175, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
        }

        const date = new Date(exp.date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const amount = `$${exp.amount.toFixed(2)}`;
        
        let description = exp.description;
        if (exp.isSettled) description += " (Settled)";
        if (description.length > 45) description = description.substring(0, 42) + "...";

        let category = exp.category;
        if (category.length > 20) category = category.substring(0, 17) + "...";

        const payer = USERS.find((u: any) => u.id === exp.payerId)?.name || "?";

        if (index % 2 === 1) {
            doc.setFillColor(250, 250, 250);
            doc.rect(14, y - 4, 182, 5, 'F');
        }

        doc.text(date, 14, y);
        doc.text(amount, 42, y, { align: "right" });
        doc.text(description, 46, y);
        doc.text(category, 130, y);
        doc.text(payer, 175, y);

        y += 5; 
      });

      doc.save(`DuoSplit_${selectedMonth}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        if (!content) { setImportError("The selected file is empty."); return; }
        try {
            const importedData = JSON.parse(content);
            if (!Array.isArray(importedData) || importedData.length === 0) {
                setImportError("Invalid or empty backup file.");
                return;
            }
            setImportCandidate(importedData);
        } catch (err) {
            setImportError("Failed to parse file.");
        }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (importCandidate) {
        onImport(importCandidate);
        setImportCandidate(null);
    }
  };

  return (
    <div className="space-y-6 relative pb-24">
      {/* Import Modal */}
      {importCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border p-6 text-center">
                  <h3 className="text-xl font-bold dark:text-white mb-2">Restore Backup?</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">Found {importCandidate.length} expenses.</p>
                  <div className="flex gap-3">
                      <button onClick={() => setImportCandidate(null)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white">Cancel</button>
                      <button onClick={confirmImport} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold">Restore</button>
                  </div>
              </div>
          </div>
      )}

      {/* Settle Confirmation Modal - This ensures the button works by showing a custom UI */}
      {showSettleConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border p-6 text-center">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
                    <ArrowRightLeft className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white mb-2">Settle This Month?</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                    This will mark all expenses for <strong>{selectedMonth}</strong> as paid.
                  </p>
                  <p className="text-slate-500 text-xs mb-6">
                    The balance will reset to $0.00, but your history will remain.
                  </p>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setShowSettleConfirm(false)} 
                        className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={confirmSettle} 
                        className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none"
                      >
                        Confirm Settle
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Monthly Report</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-lg p-2.5"
            />
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
             <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-lg p-2.5"
             >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat: any) => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
             </select>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total {USERS[0].name} Paid</div>
            <div className="text-lg font-bold text-slate-800 dark:text-white">${monthlySummary.totalPaidA.toFixed(2)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total {USERS[1].name} Paid</div>
            <div className="text-lg font-bold text-slate-800 dark:text-white">${monthlySummary.totalPaidB.toFixed(2)}</div>
        </div>
      </div>

      <div className={`p-4 rounded-xl flex items-center justify-between ${Math.abs(monthlySummary.netBalance) < 0.01 ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : monthlySummary.netBalance > 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'}`}>
         <div className="flex flex-col gap-1">
             <span className="font-medium text-sm">Month Net Balance</span>
             {!((Math.abs(monthlySummary.netBalance) < 0.01)) && (
                 <button
                    onClick={handleSettleClick}
                    className="flex items-center gap-1 text-xs font-bold underline decoration-dotted hover:decoration-solid transition-all"
                 >
                    <ArrowRightLeft className="w-3 h-3" /> Settle This Month
                 </button>
             )}
         </div>
         <div className="flex items-center gap-2 font-bold">
            {Math.abs(monthlySummary.netBalance) < 0.01 ? (
                <span>Settled / Balanced</span>
            ) : (
                <>
                    {monthlySummary.netBalance > 0 ? (
                        <span className="flex items-center gap-1 text-xs sm:text-sm">{USERS[1].name} owes {USERS[0].name} <ArrowUp className="w-4 h-4"/></span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs sm:text-sm">{USERS[0].name} owes {USERS[1].name} <ArrowDown className="w-4 h-4"/></span>
                    )}
                     <span className="text-lg">${Math.abs(monthlySummary.netBalance).toFixed(2)}</span>
                </>
            )}
         </div>
      </div>

      {categoryData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm mt-4 mb-6">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Breakdown</h3>
           <div style={{ height: chartHeight, width: '100%', minWidth: 0 }} className="-ml-2">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart layout="vertical" data={categoryData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }} tickLine={false} axisLine={false} interval={0}/>
                  <Tooltip cursor={{ fill: 'rgba(203, 213, 225, 0.3)' }} formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} background={{ fill: 'transparent' }}>
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">Transactions</h3>
        <ExpenseList expenses={filteredExpenses} onDelete={onDelete} onEdit={onEdit} />
      </div>

      <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Data Management</h3>
        <div className="grid grid-cols-1 gap-3">
            <button onClick={handleGeneratePDF} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400"><FileText className="w-5 h-5" /></div>
                    <div className="text-left"><div className="font-semibold dark:text-white">Download PDF Report</div></div>
                </div>
            </button>
            <button onClick={handleDownloadBackup} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Download className="w-5 h-5" /></div>
                    <div className="text-left"><div className="font-semibold dark:text-white">Backup Data</div></div>
                </div>
            </button>
            <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleFileUpload} onClick={(e) => (e.currentTarget.value = '')} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400"><Upload className="w-5 h-5" /></div>
                    <div className="text-left"><div className="font-semibold dark:text-white">Restore Backup</div></div>
                </div>
            </button>
            <button onClick={onReset} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors mt-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400"><Trash2 className="w-5 h-5" /></div>
                    <div className="text-left"><div className="font-semibold text-red-600 dark:text-red-400">Reset App</div></div>
                </div>
            </button>
        </div>
      </div>
    </div>
  );
};