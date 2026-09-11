import { create } from 'zustand';
import type { MealAnalysis } from '@/lib/ai/schemas';
import type { FoodItem, MealSlot, Source } from '@/lib/db/types';

export type ToastTone = 'info' | 'reward' | 'error';
export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  icon?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: ToastTone, icon?: string) => void;
  dismiss: (id: number) => void;
}

let toastSeq = 1;
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'info', icon) => {
    const id = toastSeq++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, tone, icon }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (message: string, tone?: ToastTone, icon?: string) =>
  useToastStore.getState().push(message, tone, icon);

/** A meal that has been analysed but not yet saved. Lives only for the session. */
export interface DraftMeal {
  analysis: MealAnalysis;
  /** Exact database/manual items when no AI conversion is needed. */
  preparedItems?: FoodItem[];
  source: Source;
  slot: MealSlot;
  rawInput?: string;
  imageBase64?: string;
  thumb?: Blob;
  model?: string;
  /** Editing an existing entry rather than creating one. */
  editingEntryId?: string;
}

interface SessionState {
  draft: DraftMeal | null;
  setDraft: (d: DraftMeal | null) => void;
  aiBusy: boolean;
  setAiBusy: (b: boolean) => void;
  coachLine: { text: string; at: number } | null;
  setCoachLine: (l: { text: string; at: number } | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  aiBusy: false,
  setAiBusy: (aiBusy) => set({ aiBusy }),
  coachLine: null,
  setCoachLine: (coachLine) => set({ coachLine }),
}));
