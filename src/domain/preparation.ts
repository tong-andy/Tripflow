import type { PreparationCategory } from '../types/trip';

export const preparationCategoryLabels: Record<
  PreparationCategory,
  string
> = {
  transit: '通行',
  accommodation: '住宿',
  documents: '证件',
  activities: '预订与活动',
  connectivity: '网络与设备',
  essentials: '生活用品',
};

export const preparationCategories = Object.keys(
  preparationCategoryLabels,
) as PreparationCategory[];

export function normalizePreparationCategory(
  value: string,
): PreparationCategory | undefined {
  if (preparationCategories.includes(value as PreparationCategory)) {
    return value as PreparationCategory;
  }
  if (value === 'booking') return 'activities';
  if (value === 'packing' || value === 'other') return 'essentials';
  return undefined;
}
