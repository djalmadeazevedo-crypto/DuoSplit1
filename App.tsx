import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Expense, ExpenseSummary, AppView, SplitType } from './types';
import { USERS, NAV_ITEMS } from './constants';
import { BalanceCard } from './components/BalanceCard';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { Analytics } from './components/Analytics';
import { Reports } from './components/Reports';
import { Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('duosplit_expenses');
    if (saved) {
      try {
        setExpenses(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load expenses", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('duosplit_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Helper to sort expenses by date (newest first)
  const sortExpenses = (list: Expense[]) => {
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const addExpense = (data: Omit<Expense, 'id' | 'timestamp'>, installments: number) => {
    const newExpenses: Expense[] = [];
    
    // Parse the date parts manually to avoid timezone issues during calculation
    const [startYear, startMonth, startDay] = data.date.split('-').map(Number);

    // Calculate amount per installment
    const totalAmount = data.amount;
    const baseAmount = Math.floor((totalAmount / installments) * 100) / 100;
    const remainder = Math.round((totalAmount - (baseAmount * installments)) * 100) / 100;

    for (let i = 0; i < installments; i++) {
      // Calculate proper monthly date preserving the original day if possible
      // or clamping to the last day of the target month (e.g. Jan 31 -> Feb 28)
      const targetDate = new Date(startYear, (startMonth - 1) + i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate(); // Last day of target month
      
      // Use the original day, but clamp it if the new month is shorter
      const day = Math.min(startDay, daysInMonth);
      
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Format description
      let description = data.description;
      if (installments > 1) {
        description = `${data.description} (${i + 1}/${installments})`;
      }

      // Add remainder to the last installment
      const amount = (i === installments - 1) ? baseAmount + remainder : baseAmount;

      newExpenses.push({
        ...data,
        amount, // Use the calculated split amount
        description,
        date: dateStr,
        id: uuidv4(),
        timestamp: Date.now() + i, // Ensure unique timestamps
        isSettled: false,
      });
    }

    setExpenses(prev => sortExpenses([...newExpenses, ...prev]));
  };

  const updateExpense = (updatedData: Expense) => {
    setExpenses(prev => sortExpenses(prev.map(e => e.id === updatedData.id ? updatedData : e)));
    setEditingExpense(null);
    setView(AppView.DASHBOARD);
  };

  const startEditing = (expense: Expense) => {
    setEditingExpense(expense);
    setView(AppView.ADD_EXPENSE);
  };

  const cancelEditing = () => {
    setEditingExpense(null);
    setView(AppView.DASHBOARD);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleImportExpenses = (importedData: Expense[]) => {
    try {
      // Validate dates to prevent sort errors
      const validExpenses = importedData.map(e => {
        const dateObj = new Date(e.date);
        const isValidDate = dateObj.toString() !== 'Invalid Date';
        return {
            ...e,
            date: isValidDate ? e.date : new Date().toISOString().split('T')[0] // Fallback to today if invalid
        };
      });
      
      setExpenses(sortExpenses(validExpenses));
      setView(AppView.DASHBOARD); // Redirect to Dashboard to ensure data is seen immediately
      
      // Slight delay to allow UI to settle
      setTimeout(() => {
        alert(`Successfully restored ${validExpenses.length} expenses!`);
      }, 300);
    } catch (e) {
      console.error("Import failed", e);
      alert("An error occurred while restoring data. Please check the file format.");
    }
  };

  const handleResetData = () => {
    if (window.confirm("⚠️ WARNING: This will permanently delete ALL expenses and reset the app. This cannot be undone. Are you sure?")) {
      const archiveName = `Archive_Reset_${new Date().toISOString()}`;
      localStorage.setItem(archiveName, JSON.stringify(expenses)); // Safety backup
      setExpenses([]);
      alert("App reset complete. A safety backup was saved to local storage just in case.");
    }
  };

  // UPDATED: Marks expenses as settled instead of deleting/archiving
  const settleUp = (targetMonth: string) => {
    const hasUnsettled = expenses.some(e => e.date.startsWith(targetMonth) && !e.isSettled);

    if (!hasUnsettled) {
        alert("All expenses for this month are already settled.");
        return;
    }

    // Directly update state. Confirmation is handled in the UI component (Reports.tsx)
    setExpenses(prev => prev.map(e => {
        if (e.date.startsWith(targetMonth)) {
            return { ...e, isSettled: true };
        }
        return e;
    }));
  };

  const calculateSummary = (): ExpenseSummary => {
    let totalPaidA = 0;
    let totalPaidB = 0;
    let balance = 0;

    // Get current YYYY-MM in local time to handle timezone correctly
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    expenses.forEach(exp => {
      // Only factor in expenses for the current month
      if (!exp.date.startsWith(currentYearMonth)) return;
      // UPDATED: SKIP settled expenses for the main dashboard balance
      if (exp.isSettled) return;

      const amount = exp.amount;
      const isPayerA = exp.payerId === USERS[0].id;

      if (isPayerA) {
        totalPaidA += amount;
        if (exp.splitType === SplitType.EQUAL) {
          balance += (amount / 2);
        } else {
          balance += amount;
        }
      } else {
        totalPaidB += amount;
        if (exp.splitType === SplitType.EQUAL) {
          balance -= (amount / 2);
        } else {
          balance -= amount;
        }
      }
    });

    return {
      totalPaidA,
      totalPaidB,
      netBalance: balance
    };
  };

  const summary = calculateSummary();

  const renderContent = () => {
    switch (view) {
      case AppView.ADD_EXPENSE:
        return (
          <ExpenseForm 
            onSubmit={addExpense} 
            onUpdate={updateExpense}
            onCancel={cancelEditing} 
            initialData={editingExpense || undefined}
          />
        );
      case AppView.REPORTS:
        return (
          <Reports 
            expenses={expenses} 
            onDelete={deleteExpense} 
            onEdit={startEditing}
            onImport={handleImportExpenses} 
            onReset={handleResetData}
            onSettle={settleUp} 
          />
        );
      case AppView.ANALYTICS:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Insights</h2>
            <Analytics expenses={expenses} />
          </div>
        );
      case AppView.DASHBOARD:
      default:
        // Determine current month to filter recent activity
        const now = new Date();
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentYearMonth));

        return (
          <div className="space-y-6">
            <header className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Toggle Dark Mode"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  {expenses.length} transactions
                </div>
              </div>
            </header>
            
            <BalanceCard summary={summary} />
            
            <div>
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Activity</h3>
                <button 
                  onClick={() => setView(AppView.REPORTS)}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  See All
                </button>
              </div>
              {/* Show only last 5 added items from CURRENT MONTH */}
              {currentMonthExpenses.length > 0 ? (
                <ExpenseList expenses={currentMonthExpenses.slice(0, 5)} onDelete={deleteExpense} onEdit={startEditing} />
              ) : (
                <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No activity for this month yet.</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20 transition-colors duration-300">
      <div className="max-w-md mx-auto min-h-screen bg-white dark:bg-slate-950 relative shadow-2xl border-x dark:border-slate-800">
        <main className="p-6 h-full overflow-y-auto">
          {renderContent()}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 max-w-md mx-auto z-50 transition-colors duration-300">
          <ul className="flex justify-between items-center">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = view === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                        if (item.id === AppView.ADD_EXPENSE) {
                            setEditingExpense(null); // Clear editing state when hitting Add
                        }
                        setView(item.id as AppView)
                    }}
                    className={`flex flex-col items-center gap-1 transition-colors ${
                      isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default App;