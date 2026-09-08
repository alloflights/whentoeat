import { RoomState, MealSlotType, MEAL_SLOTS, ScheduleStepRecommendation } from './types.js';

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function getNextScheduleStep(
  roomState: RoomState,
  horizonDays = 14
): ScheduleStepRecommendation | null {
  // Find pending restaurants sorted by priority (1 is highest) and orderIndex
  const pendingRestaurants = roomState.restaurants
    .filter(r => r.status === 'pending')
    .sort((a, b) => a.priority - b.priority || a.orderIndex - b.orderIndex || a.createdAt - b.createdAt);

  if (pendingRestaurants.length === 0) {
    return null;
  }

  const currentRestaurant = pendingRestaurants[0];

  // Set of occupied slots: key = `${date}_${slotType}`
  const occupiedSlots = new Set<string>();
  for (const r of roomState.restaurants) {
    if (r.status === 'scheduled' && r.scheduledDate && r.scheduledSlotType) {
      occupiedSlots.add(`${r.scheduledDate}_${r.scheduledSlotType}`);
    }
  }

  const matchingSlots: ScheduleStepRecommendation['matchingSlots'] = [];

  // Generate candidates for the next horizonDays
  const today = new Date();
  for (let i = 0; i < horizonDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateNum = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dateNum}`;
    const weekday = d.getDay();
    const dayOfWeek = DAY_NAMES[weekday];

    for (const slot of MEAL_SLOTS) {
      const slotType = slot.type;
      const slotKey = `${dateStr}_${slotType}`;
      const weeklyKey = `weekday_${weekday}_${slotType}`;

      // Check if slot is already occupied by a booked restaurant
      if (occupiedSlots.has(slotKey)) {
        continue;
      }

      // Check if user1 is busy (weekly recurring OR specific date)
      const u1Busy = Boolean(
        roomState.weeklyBusy?.user1?.[weeklyKey] ||
        roomState.dateBusy?.[slotKey]?.user1
      );

      // Check if user2 is busy (weekly recurring OR specific date)
      const u2Busy = Boolean(
        roomState.weeklyBusy?.user2?.[weeklyKey] ||
        roomState.dateBusy?.[slotKey]?.user2
      );

      // Both must be NOT busy to be mutual free!
      if (!u1Busy && !u2Busy) {
        const slotLabel = `${slot.label} (${slot.timeRange})`;
        const isPreferred =
          currentRestaurant.preferredSlotType === 'any' ||
          currentRestaurant.preferredSlotType === slotType;

        matchingSlots.push({
          date: dateStr,
          slotType,
          slotLabel,
          dayOfWeek: i === 0 ? '今天' : i === 1 ? '明天' : dayOfWeek,
          isPreferred,
        });
      }
    }
  }

  // Sort matching slots: preferred first, then chronologically by date and slot order
  matchingSlots.sort((a, b) => {
    if (a.isPreferred !== b.isPreferred) {
      return a.isPreferred ? -1 : 1;
    }
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    const order: MealSlotType[] = ['lunch', 'afternoon_tea', 'dinner', 'late_night'];
    return order.indexOf(a.slotType) - order.indexOf(b.slotType);
  });

  const totalPending = pendingRestaurants.length;
  const currentIndex = roomState.restaurants.filter(r => r.status === 'scheduled').length + 1;

  return {
    restaurant: currentRestaurant,
    matchingSlots,
    totalPendingCount: totalPending,
    currentIndex,
  };
}
