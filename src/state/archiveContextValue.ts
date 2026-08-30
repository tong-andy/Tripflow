import { createContext } from 'react';
import type {
  ArchiveData, CreateExpenseInput, CreateJournalInput, CreateMediaNoteInput,
  CreatePurchaseInput, Expense, Journal, MediaNote, Purchase,
} from '../types/archive';

export interface ArchiveContextValue extends ArchiveData {
  isLoading: boolean; isSaving: boolean; error: string | null;
  retry(): Promise<void>; clearError(): void;
  saveExpense(input: CreateExpenseInput, existing?: Expense): Promise<void>;
  deleteExpense(id: string): Promise<void>;
  savePurchase(input: CreatePurchaseInput, existing?: Purchase): Promise<void>;
  deletePurchase(id: string): Promise<void>;
  saveMediaNote(input: CreateMediaNoteInput, existing?: MediaNote): Promise<void>;
  deleteMediaNote(id: string): Promise<void>;
  saveJournal(input: CreateJournalInput, existing?: Journal): Promise<void>;
  deleteJournal(id: string): Promise<void>;
}
export const ArchiveContext = createContext<ArchiveContextValue | undefined>(undefined);
