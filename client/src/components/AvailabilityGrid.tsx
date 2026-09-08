import React, { useMemo, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { MEAL_SLOTS } from '../types';
import type { MealSlotType, BusyType, BusyRecord } from '../types';
import { getUpcomingDays, formatDateWithWeekday } from '../utils/dateHelpers';
import {
  Sparkles,
  Lock,
  BookOpen,
  Clock,
  CheckCircle2,
  X,
  GraduationCap
} from 'lucide-react';

interface ActiveModalState {
  dateStr: string;
  slotType: MealSlotType;
  slotLabel: string;
  weekday: number;
  dayOfWeek: string;
  currentRecord?: BusyRecord;
  isWeekly: boolean;
}

const PRESET_REASONS = {
  weekly: ['专业晚课/早八', '大物/专业实验', '社团例会', '学生会/值班'],
  this_week: ['期中/期末复习', '赶大作业/汇报Pre', '考证备考', '自习刷题'],
  temp: ['临时开组会', '导师找谈话', '身体不舒服', '临时私事'],
};

export const AvailabilityGrid: React.FC = () => {
  const { roomState, currentUserRole, setBusy, clearBusy } = useSocket();
  const days = useMemo(() => getUpcomingDays(10), []);

  const user1Name = roomState?.user1Name || '我';
  const user2Name = roomState?.user2Name || 'TA';

  const [activeModal, setActiveModal] = useState<ActiveModalState | null>(null);
  const [selectedBusyType, setSelectedBusyType] = useState<BusyType>('weekly');
  const [reasonInput, setReasonInput] = useState<string>('');

  // Map of occupied slots: key = `${date}_${slotType}` -> restaurantName
  const occupiedSlots = useMemo(() => {
    const map = new Map<string, { restaurantName: string; category: string }>();
    if (roomState?.restaurants) {
      for (const r of roomState.restaurants) {
        if (r.status === 'scheduled' && r.scheduledDate && r.scheduledSlotType) {
          map.set(`${r.scheduledDate}_${r.scheduledSlotType}`, {
            restaurantName: r.name,
            category: r.category,
          });
        }
      }
    }
    return map;
  }, [roomState?.restaurants]);

  // Open modal for a cell
  const handleCellClick = (
    dateStr: string,
    slotType: MealSlotType,
    slotLabel: string,
    weekday: number,
    dayOfWeek: string,
    currentRecord?: BusyRecord,
    isWeekly = false
  ) => {
    setActiveModal({
      dateStr,
      slotType,
      slotLabel,
      weekday,
      dayOfWeek,
      currentRecord,
      isWeekly,
    });
    if (currentRecord) {
      setSelectedBusyType(currentRecord.type);
      setReasonInput(currentRecord.reason || '');
    } else {
      setSelectedBusyType('weekly');
      setReasonInput('');
    }
  };

  const handleSaveBusy = (type: BusyType) => {
    if (!activeModal) return;
    setBusy(
      activeModal.dateStr,
      activeModal.slotType,
      activeModal.weekday,
      type,
      reasonInput.trim() || undefined
    );
    setActiveModal(null);
  };

  const handleSetFree = () => {
    if (!activeModal) return;
    clearBusy(
      activeModal.dateStr,
      activeModal.slotType,
      activeModal.weekday,
      true // Clear both date busy and weekly busy
    );
    setActiveModal(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-orange-50/50 via-amber-50/30 to-emerald-50/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-slate-800">
              学生作息与忙碌课表
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              默认双方均有空 ✨
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            有课或备考？点击单元格为 <span className={currentUserRole === 'user1' ? 'text-rose-600 font-bold' : 'text-sky-600 font-bold'}>
              {currentUserRole === 'user1' ? user1Name : user2Name}
            </span> 标记没空（支持<strong>每周循环上课</strong>、<strong>这周特例</strong>、<strong>临时忙碌</strong>）
          </p>
        </div>

        {/* Tip Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200">
          <BookOpen className="w-3.5 h-3.5 text-orange-500" />
          <span>只需标记上课/有事时间，剩余时段系统自动为你排进心愿餐厅</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto p-4">
        <div className="min-w-[800px]">
          {/* Table Header: Days */}
          <div className="grid grid-cols-[100px_repeat(10,1fr)] gap-2 mb-2.5 text-center text-xs">
            <div className="font-bold text-slate-400 py-2 flex items-center justify-center">
              时段
            </div>
            {days.map((day) => (
              <div
                key={day.dateStr}
                className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-colors ${
                  day.dayOfWeek === '今天'
                    ? 'bg-orange-500 text-white font-bold shadow-xs shadow-orange-200'
                    : day.isWeekend
                    ? 'bg-amber-100/70 border border-amber-200/80 text-amber-900 font-bold'
                    : 'bg-slate-50 border border-slate-100 text-slate-700'
                }`}
              >
                <span className={`text-[10px] font-mono ${day.dayOfWeek === '今天' ? 'text-white/80' : 'text-slate-400'}`}>
                  {day.monthDay}
                </span>
                <span className="text-xs font-bold">{day.dayOfWeek}</span>
              </div>
            ))}
          </div>

          {/* Table Rows: Meal Slots */}
          <div className="space-y-2.5">
            {MEAL_SLOTS.map((slot) => (
              <div
                key={slot.type}
                className="grid grid-cols-[100px_repeat(10,1fr)] gap-2 items-stretch"
              >
                {/* Slot Label (Left Column) */}
                <div className="bg-slate-50 rounded-2xl p-2 flex flex-col justify-center items-center border border-slate-200/80 text-center">
                  <span className="text-base leading-none mb-1">{slot.icon}</span>
                  <span className="text-xs font-extrabold text-slate-800">{slot.label}</span>
                  <span className="text-[10px] text-slate-400 scale-90">{slot.timeRange.split(' ')[0]}</span>
                </div>

                {/* 10 Day Cells for this Slot */}
                {days.map((day) => {
                  const slotKey = `${day.dateStr}_${slot.type}`;
                  const weeklyKey = `weekday_${day.weekday}_${slot.type}`;

                  const isOccupied = occupiedSlots.has(slotKey);
                  const occupiedInfo = occupiedSlots.get(slotKey);

                  // Check User 1 busy
                  const u1Weekly = roomState?.weeklyBusy?.user1?.[weeklyKey];
                  const u1Date = roomState?.dateBusy?.[slotKey]?.user1;
                  const u1BusyRecord = u1Weekly || u1Date;
                  const isU1Weekly = Boolean(u1Weekly);

                  // Check User 2 busy
                  const u2Weekly = roomState?.weeklyBusy?.user2?.[weeklyKey];
                  const u2Date = roomState?.dateBusy?.[slotKey]?.user2;
                  const u2BusyRecord = u2Weekly || u2Date;
                  const isU2Weekly = Boolean(u2Weekly);

                  // Mutual free = Neither is busy and slot is not occupied
                  const isMutualFree = !isOccupied && !u1BusyRecord && !u2BusyRecord;

                  // Current active user record
                  const currentRecord = currentUserRole === 'user1' ? u1BusyRecord : u2BusyRecord;
                  const isCurrentWeekly = currentUserRole === 'user1' ? isU1Weekly : isU2Weekly;

                  // Styling
                  let cellStyle = '';
                  if (isOccupied) {
                    cellStyle = 'bg-slate-100 border-slate-300 text-slate-500 shadow-inner cursor-not-allowed';
                  } else if (isMutualFree) {
                    cellStyle = 'bg-gradient-to-br from-emerald-50/90 to-teal-50/80 border-emerald-300/80 hover:border-emerald-500 hover:from-emerald-100 hover:to-teal-100 shadow-2xs';
                  } else {
                    cellStyle = 'bg-slate-50/80 border-slate-200/90 hover:bg-slate-100/80 text-slate-700';
                  }

                  return (
                    <button
                      key={slotKey}
                      onClick={() => {
                        if (!isOccupied) {
                          handleCellClick(
                            day.dateStr,
                            slot.type,
                            slot.label,
                            day.weekday,
                            day.dayOfWeek,
                            currentRecord,
                            isCurrentWeekly
                          );
                        }
                      }}
                      disabled={isOccupied}
                      title={
                        isOccupied
                          ? `已敲定：${occupiedInfo?.restaurantName}`
                          : `点击标记 ${currentUserRole === 'user1' ? user1Name : user2Name} 是否没空`
                      }
                      className={`min-h-[64px] rounded-2xl border p-1.5 flex flex-col justify-between items-center transition-all select-none group text-left ${cellStyle}`}
                    >
                      {/* Occupied State */}
                      {isOccupied ? (
                        <div className="flex flex-col items-center justify-center h-full w-full py-0.5 text-center">
                          <Lock className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                          <span className="text-[10px] font-bold text-slate-700 line-clamp-1 w-full">
                            {occupiedInfo?.restaurantName}
                          </span>
                        </div>
                      ) : isMutualFree ? (
                        /* Both are Free! Default state */
                        <div className="flex flex-col items-center justify-center h-full w-full">
                          <div className="flex items-center gap-1 text-emerald-700 font-black text-[11px] leading-tight mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-400" />
                            <span>均有空</span>
                          </div>
                          <span className="text-[10px] text-emerald-600/90 bg-emerald-100/60 px-2 py-0.2 rounded-full font-medium">
                            可约饭
                          </span>
                        </div>
                      ) : (
                        /* At least one person is busy */
                        <div className="flex flex-col justify-center gap-1 w-full h-full py-0.5">
                          {/* User 1 Busy Badge */}
                          {u1BusyRecord && (
                            <div className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-lg bg-rose-100/90 text-rose-800 font-semibold truncate border border-rose-200">
                              <span className="shrink-0">
                                {u1BusyRecord.type === 'weekly' ? '🔄' : u1BusyRecord.type === 'this_week' ? '📅' : '⏱️'}
                              </span>
                              <span className="truncate">
                                {user1Name}: {u1BusyRecord.reason || (u1BusyRecord.type === 'weekly' ? '每周有课' : u1BusyRecord.type === 'this_week' ? '这周没空' : '暂时有事')}
                              </span>
                            </div>
                          )}

                          {/* User 2 Busy Badge */}
                          {u2BusyRecord && (
                            <div className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-lg bg-sky-100/90 text-sky-800 font-semibold truncate border border-sky-200">
                              <span className="shrink-0">
                                {u2BusyRecord.type === 'weekly' ? '🔄' : u2BusyRecord.type === 'this_week' ? '📅' : '⏱️'}
                              </span>
                              <span className="truncate">
                                {user2Name}: {u2BusyRecord.reason || (u2BusyRecord.type === 'weekly' ? '每周有课' : u2BusyRecord.type === 'this_week' ? '这周没空' : '暂时有事')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold text-emerald-700">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 flex items-center justify-center text-[10px] text-white">✓</span>
            <span>双方均有空（可约饭）</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm leading-none">🔄</span>
            <span>每周固定没空（课表/固定活动）</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm leading-none">📅</span>
            <span>这周没空（备考/赶作业特例）</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm leading-none">⏱️</span>
            <span>暂时没空（临时有事）</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span>已排入餐厅（锁定）</span>
          </div>
        </div>
      </div>

      {/* Busy Setting Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white relative">
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-xs text-white/90 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDateWithWeekday(activeModal.dateStr)} {activeModal.slotLabel}</span>
              </div>
              <h3 className="text-base font-black">
                设置 {currentUserRole === 'user1' ? user1Name : user2Name} 的没空状态
              </h3>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {/* Option 1: 每周固定没空 */}
              <div
                onClick={() => setSelectedBusyType('weekly')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedBusyType === 'weekly'
                    ? 'border-purple-500 bg-purple-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-sm">
                    🔄
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800">
                        每周固定没空（每周重复）
                      </h4>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-100 text-purple-800 font-bold">
                        课表 / 社团推荐
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      自动适用于<strong>未来每一周的{activeModal.dayOfWeek}{activeModal.slotLabel}</strong>，不需要每周重复点。
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 2: 这周没空 */}
              <div
                onClick={() => setSelectedBusyType('this_week')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedBusyType === 'this_week'
                    ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-sm">
                    📅
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800">
                        这周没空（仅限当周）
                      </h4>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                        备考 / 大作业推荐
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      仅在<strong>{activeModal.dateStr}（本周）</strong>生效，下周同星期依然默认有空。
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 3: 暂时没空 */}
              <div
                onClick={() => setSelectedBusyType('temp')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedBusyType === 'temp'
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-sm">
                    ⏱️
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800">
                        暂时没空（临时有事）
                      </h4>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 font-bold">
                        临时状态
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      临时有开会或私事，随时可再点一下一键解除。
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason Tag Selector & Input */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  忙碌原因备注（选填，方便对方看到）:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_REASONS[selectedBusyType].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setReasonInput(tag)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                        reasonInput === tag
                          ? 'bg-slate-900 text-white border-slate-900 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  maxLength={15}
                  placeholder="或者手动输入：如高数课 / 导师组会"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSetFree}
                  className="text-xs px-3.5 py-2.5 rounded-xl border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>撤销并设为有空</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="text-xs px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-medium transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveBusy(selectedBusyType)}
                    className="text-xs px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors shadow-xs"
                  >
                    确认设为没空
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
