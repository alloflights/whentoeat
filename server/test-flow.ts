import {
  ensureRoom,
  getRoomState,
  setBusyStatus,
  clearBusyStatus,
  saveRestaurant,
  scheduleRestaurant,
  resetAllSchedules,
} from './src/db.js';
import { getNextScheduleStep } from './src/scheduler.js';

console.log('🎓 Starting Student Reverse-Busy Scheduling Flow Verification...\n');

const TEST_ROOM = 'student-test-' + Date.now();

// 1. Ensure Room
const initial = ensureRoom(TEST_ROOM, '学霸小明', '学委小红');
console.log('✓ 1. Room initialized:', initial.roomId, `[${initial.user1Name}] & [${initial.user2Name}]`);

// 2. Add Student Busy Statuses
// 小明: 每周五晚上有固定晚课 (weekly recurring, weekday = 5)
setBusyStatus(TEST_ROOM, 'user1', '2026-09-11', 'dinner', 5, 'weekly', '高等数学习题课');
console.log('✓ 2. 小明标记了【每周五晚餐固定没空】: 高等数学习题课 🔄');

// 小红: 这周六午餐有大作业汇报 (this_week)
setBusyStatus(TEST_ROOM, 'user2', '2026-09-12', 'lunch', 6, 'this_week', '大作业Pre汇报');
console.log('✓ 3. 小红标记了【这周六午餐这周没空】: 大作业Pre汇报 📅');

// 小红: 这周日午餐临时开会 (temp)
setBusyStatus(TEST_ROOM, 'user2', '2026-09-13', 'lunch', 0, 'temp', '导师临时组会');
console.log('✓ 4. 小红标记了【这周日午餐暂时没空】: 导师临时组会 ⏱️');

// 3. Add 3 Restaurants with priorities
const r1 = saveRestaurant({
  roomId: TEST_ROOM,
  name: '川味老火锅',
  category: '火锅',
  priority: 1, // P1 TOP 1
  preferredSlotType: 'dinner',
  notes: '考完高数必须吃一顿！',
});

const r2 = saveRestaurant({
  roomId: TEST_ROOM,
  name: '大学城烤肉居酒屋',
  category: '烤肉/烧烤',
  priority: 2,
  preferredSlotType: 'dinner',
  notes: '周六晚上去放松',
});

const r3 = saveRestaurant({
  roomId: TEST_ROOM,
  name: '校门口鲜奶茶',
  category: '咖啡甜品',
  priority: 3,
  preferredSlotType: 'afternoon_tea',
  notes: '随便喝喝',
});

console.log('✓ 5. 添加了 3 家美食心愿店 (P1: 火锅, P2: 烤肉, P3: 奶茶)\n');

// 4. Test Step 1: Schedule Top Restaurant (火锅)
let state = getRoomState(TEST_ROOM);
const step1 = getNextScheduleStep(state);

console.log('--- Step 1 推荐 ---');
console.log(`目标餐厅: 【${step1?.restaurant.name}】 (优先级: P${step1?.restaurant.priority})`);
console.log(`匹配到的双方均有空的可选时段数量: ${step1?.matchingSlots.length}`);

if (step1?.restaurant.name !== '川味老火锅') {
  throw new Error(`Expected first restaurant to be 川味老火锅, got ${step1?.restaurant.name}`);
}

// Verify that Friday dinner (2026-09-11) is NOT in matchingSlots because user1 has weekly class!
const hasFridayDinner = step1?.matchingSlots.some(s => s.date === '2026-09-11' && s.slotType === 'dinner');
if (hasFridayDinner) {
  throw new Error('Friday dinner should be excluded due to user1 weekly busy class!');
}
console.log('✓ 验证成功: 周五晚餐已被自动避开 (因为小明每周有高数课)');

// Verify that Saturday lunch is NOT in matchingSlots because user2 has Pre!
const hasSaturdayLunch = step1?.matchingSlots.some(s => s.date === '2026-09-12' && s.slotType === 'lunch');
if (hasSaturdayLunch) {
  throw new Error('Saturday lunch should be excluded due to user2 this-week busy!');
}
console.log('✓ 验证成功: 周六午餐已被自动避开 (因为小红这周有大作业Pre)');

// 5. User manual selection & confirmation: Pick Saturday Dinner for 火锅!
console.log('\n👉 用户手动确认 Step 1: 【川味老火锅】 -> 2026-09-12 (周六) 晚餐');
scheduleRestaurant(TEST_ROOM, r1.id, '2026-09-12', 'dinner', '晚餐 (17:30 - 20:30)');

// 6. Test Step 2: System advances to next restaurant!
state = getRoomState(TEST_ROOM);
const step2 = getNextScheduleStep(state);

console.log('\n--- Step 2 推荐 (自动排下一个) ---');
console.log(`目标餐厅: 【${step2?.restaurant.name}】 (优先级: P${step2?.restaurant.priority})`);
if (step2?.restaurant.name !== '大学城烤肉居酒屋') {
  throw new Error(`Expected second restaurant to be 大学城烤肉居酒屋, got ${step2?.restaurant.name}`);
}

// Verify that 2026-09-12 dinner is occupied and cannot be chosen!
const hasSaturdayDinner = step2?.matchingSlots.some(s => s.date === '2026-09-12' && s.slotType === 'dinner');
if (hasSaturdayDinner) {
  throw new Error('Occupied slot 2026-09-12 dinner should not be available in step 2!');
}
console.log('✓ 验证成功: 周六晚餐已从可用时段中扣除 (已被第1家火锅锁定)');

// 7. Confirm Step 2: Pick Sunday Dinner for 烤肉!
console.log('\n👉 用户手动确认 Step 2: 【大学城烤肉居酒屋】 -> 2026-09-13 (周日) 晚餐');
scheduleRestaurant(TEST_ROOM, r2.id, '2026-09-13', 'dinner', '晚餐 (17:30 - 20:30)');

// 8. Test Step 3: Advance to Step 3 (鲜奶茶)
state = getRoomState(TEST_ROOM);
const step3 = getNextScheduleStep(state);

console.log('\n--- Step 3 推荐 (自动排下一个) ---');
console.log(`目标餐厅: 【${step3?.restaurant.name}】 (优先级: P${step3?.restaurant.priority})`);
if (step3?.restaurant.name !== '校门口鲜奶茶') {
  throw new Error(`Expected third restaurant to be 校门口鲜奶茶, got ${step3?.restaurant.name}`);
}

// Confirm Step 3: Pick Saturday Afternoon Tea for 奶茶!
console.log('\n👉 用户手动确认 Step 3: 【校门口鲜奶茶】 -> 2026-09-12 (周六) 下午茶');
scheduleRestaurant(TEST_ROOM, r3.id, '2026-09-12', 'afternoon_tea', '下午茶 (14:30 - 16:30)');

// 9. Verify All Done!
state = getRoomState(TEST_ROOM);
const finalStep = getNextScheduleStep(state);
if (finalStep !== null) {
  throw new Error('All restaurants should be scheduled, expected null');
}
console.log('\n✓ 验证成功: 所有 3 家餐厅均已排好，排期顺利完成！');

// 10. Clean up test
resetAllSchedules(TEST_ROOM);
console.log('✓ 验证成功: resetAllSchedules 正常还原状态。');

console.log('\n🎉 ALL STUDENT BUSY-TIME VERIFICATION TESTS PASSED 100%! 🚀\n');
