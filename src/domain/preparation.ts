import type { PreparationCategory } from '../types/trip';

export const preparationCategoryLabels: Record<
  PreparationCategory,
  string
> = {
  documents: '证件',
  booking: '预订',
  packing: '行李',
  other: '其他',
};

