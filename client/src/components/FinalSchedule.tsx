import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { formatDateWithWeekday } from '../utils/dateHelpers';
import {
  Calendar,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Trash2
} from 'lucide-react';

interface FinalScheduleProps {
  onBackToMain: () => void;
}

export const FinalSchedule: React.FC<FinalScheduleProps> = ({ onBackToMain }) => {
  const { roomState, unscheduleRestaurant, resetAllSchedules, openScheduler } = useSocket();
  const [copied, setCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const scheduledRestaurants = (roomState?.restaurants || [])
    .filter(r => r.status === 'scheduled' && r.scheduledDate)
    .sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate) {
        return (a.scheduledDate || '').localeCompare(b.scheduledDate || '');
      }
      const order = ['lunch', 'afternoon_tea', 'dinner', 'late_night'];
      return order.indexOf(a.scheduledSlotType || '') - order.indexOf(b.scheduledSlotType || '');
    });

  const handleCopyText = () => {
    if (scheduledRestaurants.length === 0) return;

    const u1 = roomState?.user1Name || '我';
    const u2 = roomState?.user2Name || 'TA';

    let text = `🥢 【${u1} & ${u2} 的专属约饭日程】\n-------------------------------\n`;
    scheduledRestaurants.forEach((r, idx) => {
      text += `${idx + 1}. ${formatDateWithWeekday(r.scheduledDate!)} ${r.scheduledSlotLabel || ''}\n`;
      text += `   📍 餐厅：${r.name} (${r.category})\n`;
      if (r.notes) {
        text += `   💬 备注：${r.notes}\n`;
      }
      text += `\n`;
    });
    text += `-------------------------------\n一起享受美食吧！🎉✨`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>EatTogether 最终日程</span>
          </div>
          <h2 className="text-2xl font-black">
            {roomState?.user1Name || '我'} 与 {roomState?.user2Name || 'TA'} 的美食日历
          </h2>
          <p className="text-xs text-white/80 mt-1">
            已敲定 {scheduledRestaurants.length} 顿大餐，所有时间均为双方空闲交集！
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyText}
            disabled={scheduledRestaurants.length === 0}
            className="px-4 py-2 rounded-xl bg-white text-orange-600 hover:bg-orange-50 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '已复制文本清单！' : '复制微信约饭单'}</span>
          </button>

          <button
            onClick={onBackToMain}
            className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
          >
            返回工作台
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {scheduledRestaurants.length === 0 ? (
          <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 mb-1">
              还没有安排任何约饭日程
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              在「排期工作台」勾选两人的空闲时段，并添加想吃的餐厅，点击“智能排期”即可自动排定。
            </p>
            <button
              onClick={onBackToMain}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors"
            >
              前往排期工作台
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Timeline */}
            <div className="relative pl-6 sm:pl-8 border-l-2 border-orange-200 space-y-6">
              {scheduledRestaurants.map((restaurant, idx) => (
                <div key={restaurant.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center ring-4 ring-orange-100 shadow-xs">
                    {idx + 1}
                  </div>

                  {/* Card */}
                  <div className="bg-slate-50 hover:bg-orange-50/40 border border-slate-200/90 rounded-2xl p-4 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-orange-500 text-white text-xs font-bold">
                          {formatDateWithWeekday(restaurant.scheduledDate!)}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {restaurant.scheduledSlotLabel}
                        </span>
                      </div>

                      {/* Unschedule button */}
                      <button
                        onClick={() => unscheduleRestaurant(restaurant.id)}
                        className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors self-start sm:self-auto"
                        title="取消此排期并放回待选"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>重新排期</span>
                      </button>
                    </div>

                    <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-200/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-slate-900">
                            {restaurant.name}
                          </h4>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
                            {restaurant.category}
                          </span>
                        </div>
                        {restaurant.notes && (
                          <p className="text-xs text-slate-500 mt-1">
                            💬 备注: {restaurant.notes}
                          </p>
                        )}
                      </div>

                      <span className="text-xs font-bold text-orange-600 bg-orange-100/70 px-2.5 py-1 rounded-lg shrink-0">
                        P{restaurant.priority} 优先级
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空并重置全部排期</span>
              </button>

              <button
                onClick={openScheduler}
                className="text-xs px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>继续排其他心愿餐厅</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl text-center">
            <h4 className="text-base font-bold text-slate-800 mb-2">
              确定要重置所有排期吗？
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              所有已敲定的餐厅将重新变回“待排期”状态，空闲时间也将重新被释放。
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  resetAllSchedules();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
