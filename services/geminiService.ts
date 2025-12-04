import { Expense, ReceiptData } from '../types';

/**
 * Analyzes a receipt image to extract expense details.
 * MOCK IMPLEMENTATION: AI Service removed for deployment stability.
 */
export const analyzeReceipt = async (base64Image: string): Promise<ReceiptData> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return placeholder data
  return {
    amount: 0,
    description: "Receipt Scanned (AI Disabled)",
    category: "Other",
    date: new Date().toISOString().split('T')[0]
  };
};

/**
 * Analyzes spending history to provide insights.
 * MOCK IMPLEMENTATION: AI Service removed for deployment stability.
 */
export const analyzeSpendingHabits = async (expenses: Expense[]): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  return "AI insights are currently disabled in this deployment to ensure stability. Please configure the Gemini API locally to enable this feature.";
};