export const expenseCategories = [
  'flight', 'accommodation', 'transport', 'food', 'shopping', 'ticket', 'other',
] as const;
export type ExpenseCategory = (typeof expenseCategories)[number];
export type MediaType = 'video' | 'photo' | 'audio' | 'other';

export interface Expense {
  id: string; tripId: string; date: string; title: string; amount: number;
  currency: string; category: ExpenseCategory; notes: string;
  createdAt: string; updatedAt: string;
}
export interface Purchase {
  id: string; tripId: string; date: string; title: string; amount: number;
  currency: string; location: string; recipient: string; notes: string;
  organized: boolean; createdAt: string; updatedAt: string;
}
export interface MediaNote {
  id: string; tripId: string; tripDayId: string | null;
  itineraryItemId: string | null; mediaType: MediaType; filename: string;
  notes: string; favorite: boolean; createdAt: string; updatedAt: string;
}
export interface Journal {
  id: string; tripId: string; tripDayId: string; content: string;
  rating: number | null; createdAt: string; updatedAt: string;
}

export type CreateExpenseInput = Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>;
export type UpdateExpenseInput = CreateExpenseInput;
export type CreatePurchaseInput = Omit<Purchase, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>;
export type UpdatePurchaseInput = CreatePurchaseInput;
export type CreateMediaNoteInput = Omit<MediaNote, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>;
export type UpdateMediaNoteInput = CreateMediaNoteInput;
export type CreateJournalInput = Omit<Journal, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>;
export type UpdateJournalInput = Pick<Journal, 'content' | 'rating'>;

export interface ArchiveData {
  expenses: Expense[];
  purchases: Purchase[];
  mediaNotes: MediaNote[];
  journals: Journal[];
}
