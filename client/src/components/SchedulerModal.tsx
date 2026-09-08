import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { formatDateWithWeekday } from '../utils/dateHelpers';
import {
  Sparkles,
  Check,
  X,
  Clock,
  Calendar,
  AlertCircle,
  PartyPopper,
  Flame,
  ArrowRight
} from 'lucide-react';

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewSchedule: () => void;
}

export const SchedulerModal: React.FC<SchedulerModalProps> = ({
  isOpen,
  onClose,
  onViewSchedule,
}) => {
  const {
    scheduleStep,
    confirmScheduleStep,
    skipScheduleStep,
    roomState,
    lastConfirmedRestaurantName,
  } = useSocket();

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset selected slot when current restaurant changes
  useEffect(() => {
    setSelectedSlotIndex(0);
    setIsSubmitting(false);
  }, [scheduleStep?.restaurant.id]);

  if (!isOpen) return null;

  const currentRestaurant = scheduleStep?.restaurant;
  const matchingSlots = scheduleStep?.matchingSlots || [];
  const scheduledCount = roomState?.restaurants.filter(r => r.status === 'scheduled').length || 0;
  const totalCount = roomState?.restaurants.length || 0;

  const handleConfirm = () => {
    if (!currentRestaurant || matchingSlots.length === 0) return;
    const selected = matchingSlots[selectedSlotIndex];
    if (!selected) return;

    setIsSubmitting(true);
    confirmScheduleStep(
      currentRestaurant.id,
      selected.date,
      selected.slotType,
      selected.slotLabel
    );
  };

  const handleSkip = () => {
    if (!currentRestaurant) return;
    skipScheduleStep(currentRestaurant.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-orange-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-white/90 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>步进式自动排期引擎</span>
          </div>

          <h2 className="text-xl font-black tracking-tight">
            {scheduleStep ? '为心愿美食安排黄金时间' : '排期顺利完成！'}
          </h2>

          <div className="mt-2 flex items-center gap-2 text-xs text-white/80">
            <span>已排定: {scheduledCount} / {totalCount}</span>
            <div className="flex-1 bg-black/20 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-500 rounded-full"
                style={{ width: `${totalCount > 0 ? (scheduledCount / totalCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {scheduleStep ? (
            <>
              {/* Previous Confirmation Toast if any */}
              {lastConfirmedRestaurantName && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-800 animate-in slide-in-from-top-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    ✓
                  </span>
                  <span>
                    刚刚已成功敲定 <strong>【{lastConfirmedRestaurantName}】</strong>，现已扣除该时段，正在为您排下一顺位：
                  </span>
                </div>
              )}

              {/* Current Restaurant Card */}
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-orange-200 text-orange-800 text-xs font-bold font-mono">
                      TOP {scheduleStep.currentIndex}
                    </span>
                    <h3 className="text-lg font-black text-slate-900">
                      {currentRestaurant?.name}
                    </h3>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    <Flame className="w-3 h-3 text-rose-500 fill-rose-500" />
                    <span>P{currentRestaurant?.priority} 优先级</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-1">
                  <span className="px-2 py-0.5 bg-white rounded-md border border-orange-100 font-medium text-slate-700">
                    {currentRestaurant?.category}
                  </span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-orange-100 font-medium text-slate-700">
                    偏好: {currentRestaurant?.preferredSlotType === 'any' ? '任意时段' : currentRestaurant?.preferredSlotType}
                  </span>
                  {currentRestaurant?.notes && (
                    <span className="text-slate-500 italic">
                      💬 {currentRestaurant.notes}
                    </span>
                  )}
                </div>
              </div>

              {/* Matching Available Slots Selection */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>双方均空闲的可选时段 ({matchingSlots.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    点击卡片即可切换心仪时段
                  </span>
                </div>

                {matchingSlots.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                    <p className="text-xs font-bold text-amber-900">
                      当前没有双方重叠且未被占用的空闲时间
                    </p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      你可以先跳过这家排下一家；或者关闭弹窗去「空闲时段表」勾选更多时间后再来排。
                    </p>
                    <button
                      onClick={handleSkip}
                      className="mt-2 text-xs px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded-xl transition-colors"
                    >
                      跳过这家，排下一家
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {matchingSlots.map((slot, index) => {
                      const isSelected = selectedSlotIndex === index;
                      return (
                        <div
                          key={`${slot.date}_${slot.slotType}`}
                          onClick={() => setSelectedSlotIndex(index)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-500 text-white shadow-md shadow-orange-200 scale-[1.01]'
                              : 'bg-slate-50 hover:bg-orange-50/50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-white text-orange-600 border border-slate-200'
                            }`}>
                              {slot.dayOfWeek}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                  {formatDateWithWeekday(slot.date)}
                                </span>
                                {slot.isPreferred && (
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                                    isSelected ? 'bg-white/30 text-white' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    偏好匹配
                                  </span>
                                )}
                                {index === 0 && (
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    isSelected ? 'bg-amber-300 text-amber-950' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    首选推荐
                                  </span>
                                )}
                              </div>
                              <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                {slot.slotLabel}
                              </p>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isSelected
                              ? 'bg-white text-orange-600 border-white'
                              : 'border-slate-300 text-transparent'
                          }`}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* All Done Celebration Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-white mx-auto shadow-lg shadow-orange-200">
                <PartyPopper className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  约饭排期全部安排完毕！🎉
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  心愿单里的餐厅已经全部匹配到双方最合适的时间，或者已无可分配的时段。快去查看最终日程吧！
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onViewSchedule();
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-200 transition-all flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>查看敲定的约饭日程</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        {scheduleStep && (
          <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={handleSkip}
              className="text-xs px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 font-medium transition-colors"
            >
              稍后再排 / 跳过
            </button>

            <button
              onClick={handleConfirm}
              disabled={matchingSlots.length === 0 || isSubmitting}
              className={`text-xs px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-sm ${
                matchingSlots.length > 0 && !isSubmitting
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-200 hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>确认此时间，排下一个</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
