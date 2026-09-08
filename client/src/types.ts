export type UserRole = 'user1' | 'user2';

export type MealSlotType = 'lunch' | 'afternoon_tea' | 'dinner' | 'late_night';

export type BusyType = 'weekly' | 'this_week' | 'temp';

export interface BusyRecord {
  type: BusyType;
  reason?: string;
}

export interface SlotInfo {
  type: MealSlotType;
  label: string;
  timeRange: string;
  icon: string;
}

export const MEAL_SLOTS: SlotInfo[] = [
  { type: 'lunch', label: '午餐', timeRange: '11:30 - 13:30', icon: '☀️' },
  { type: 'afternoon_tea', label: '下午茶', timeRange: '14:30 - 16:30', icon: '☕' },
  { type: 'dinner', label: '晚餐', timeRange: '17:30 - 20:30', icon: '🌙' },
  { type: 'late_night', label: '夜宵', timeRange: '21:00 - 23:30', icon: '🍢' }
];

export interface Restaurant {
  id: string;
  roomId: string;
  name: string;
  category: string;
  priority: number; // 1: 必须吃, 2: 很想吃, 3: 想尝试, 4: 备选
  preferredSlotType: 'any' | MealSlotType;
  notes?: string;
  status: 'pending' | 'scheduled' | 'skipped';
  scheduledDate?: string;
  scheduledSlotType?: MealSlotType;
  scheduledSlotLabel?: string;
  createdAt: number;
  orderIndex: number;
}

export interface RoomState {
  roomId: string;
  user1Name: string;
  user2Name: string;
  // 1. 每周固定没空（如课表、社团例会）：key 格式如 "weekday_3_dinner"
  weeklyBusy: {
    user1: Record<string, BusyRecord>;
    user2: Record<string, BusyRecord>;
  };
  // 2. 具体某天的没空（如这周复习、临时有事）：key 格式如 "2026-09-11_dinner"
  dateBusy: Record<string, {
    user1?: BusyRecord;
    user2?: BusyRecord;
  }>;
  restaurants: Restaurant[];
  updatedAt: number;
}

export interface ScheduleStepRecommendation {
  restaurant: Restaurant;
  matchingSlots: Array<{
    date: string;
    slotType: MealSlotType;
    slotLabel: string;
    dayOfWeek: string;
    isPreferred: boolean;
  }>;
  totalPendingCount: number;
  currentIndex: number;
}
