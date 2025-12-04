import React, { useEffect, useState } from 'react';
import { Expense } from '../types';
import { analyzeSpendingHabits } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Sparkles, Loader2 } from 'lucide-react';

interface AnalyticsProps {
  expenses: Expense[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ expenses }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Group by Category
  const data = React.useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  const handleGenerateInsight = async () => {
    setLoading(true);
    const result = await analyzeSpendingHabits(expenses);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Spending by Category</h3>
        {/* Added min-w-0 to fix Recharts warning */}
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `$${value.toFixed(2)}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <h3 className="font-bold text-lg">AI Financial Advisor</h3>
        </div>
        
        {!insight && !loading && (
          <div className="text-center py-6">
            <p className="text-indigo-100 mb-4 text-sm">Get personalized tips and spending analysis powered by Gemini.</p>
            <button
              onClick={handleGenerateInsight}
              className="px-6 py-2 bg-white text-indigo-600 font-semibold rounded-full shadow-lg hover:bg-indigo-50 transition-colors"
            >
              Analyze Spending
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
            <span className="text-sm font-medium text-indigo-100">Crunching the numbers...</span>
          </div>
        )}

        {insight && (
          <div className="prose prose-invert prose-sm max-w-none">
             <div className="whitespace-pre-line text-indigo-50 leading-relaxed">
               {insight}
             </div>
             <button 
               onClick={() => setInsight(null)}
               className="mt-4 text-xs text-indigo-200 hover:text-white underline"
             >
               Clear Analysis
             </button>
          </div>
        )}
      </div>
    </div>
  );
};