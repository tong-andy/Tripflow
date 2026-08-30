import {
  Archive,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  Luggage,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

export interface NavigationItem {
  label: string;
  shortLabel: string;
  to: string;
  icon: LucideIcon;
}

export const desktopNavigationItems: NavigationItem[] = [
  { label: '我的旅行', shortLabel: '旅行', to: '/trips', icon: Luggage },
  {
    label: '旅行总览',
    shortLabel: '总览',
    to: '/overview',
    icon: LayoutDashboard,
  },
  {
    label: '准备',
    shortLabel: '准备',
    to: '/preparation',
    icon: ClipboardCheck,
  },
  {
    label: '行程',
    shortLabel: '行程',
    to: '/itinerary',
    icon: CalendarDays,
  },
  { label: '记录', shortLabel: '记录', to: '/archive', icon: Archive },
  { label: '我的', shortLabel: '我的', to: '/profile', icon: UserRound },
];

export const bottomNavigationItems: NavigationItem[] = [
  { label: '我的旅行', shortLabel: '旅行', to: '/trips', icon: Luggage },
  { label: '准备', shortLabel: '准备', to: '/preparation', icon: ClipboardCheck },
  { label: '行程', shortLabel: '行程', to: '/itinerary', icon: CalendarDays },
  { label: '记录', shortLabel: '记录', to: '/archive', icon: Archive },
  { label: '我的', shortLabel: '我的', to: '/profile', icon: UserRound },
];
