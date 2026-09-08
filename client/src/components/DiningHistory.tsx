import React, { useState, useMemo } from 'react';
import { useSocket } from '../context/SocketContext';
import { formatDateWithWeekday } from '../utils/dateHelpers';
import { MEAL_SLOTS } from '../types';
import type { MealSlotType, Restaurant } from '../types';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Calendar,
  Utensils,
  Star,
  MessageSquare,
  Plus,
  Trash2,
  RotateCcw,
  Pencil,
  X,
  Award
} from 'lucide-react';

const CATEGORY_PRESETS = [
  '火锅', '烤肉/烧烤', '日料居酒屋', '西餐酒吧',
  '川湘菜', '粤菜早茶', '咖啡甜品', '小吃排档',
  '自助/自主', '自主填写...'
];

interface DiningHistoryProps {
  onGoToSchedule?: () => void;
}

export const DiningHistory: React.FC<DiningHistoryProps> = ({ onGoToSchedule }) => {
  const { roomState, completeRestaurant, addCompletedRestaurant, revisitRestaurant, deleteRestaurant } = useSocket();

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Restaurant | null>(null);

  // Manual record form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('火锅');
  const [customCategory, setCustomCategory] = useState('');
  const [eatenDate, setEatenDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotType, setSlotType] = useState<MealSlotType>('dinner');
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState('');
  const [cost, setCost] = useState('');

  // All completed / eaten restaurants
  const completedList = useMemo(() => {
    return (roomState?.restaurants || [])
      .filter(r => r.status === 'completed')
      .sort((a, b) => {
        const dateA = a.eatenDate || a.scheduledDate || '';
        const dateB = b.eatenDate || b.scheduledDate || '';
        return dateB.localeCompare(dateA); // newest first
      });
  }, [roomState?.restaurants]);

  // Statistics
  const stats = useMemo(() => {
    const total = completedList.length;
    if (total === 0) return { total: 0, avgRating: '0.0', topCategory: '暂无' };

    const sumRating = completedList.reduce((acc, cur) => acc + (cur.rating || 5), 0);
    const avgRating = (sumRating / total).toFixed(1);

    const categoryCounts: Record<string, number> = {};
    completedList.forEach(r => {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    });

    let topCategory = '暂无';
    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = cat;
      }
    });

    return { total, avgRating, topCategory };
  }, [completedList]);

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category === '自主填写...'
      ? (customCategory.trim() || '自主')
      : category;

    const slotLabel = MEAL_SLOTS.find(s => s.type === slotType)?.label || '晚餐';

    addCompletedRestaurant({
      name: name.trim(),
      category: finalCategory,
      eatenDate,
      scheduledSlotType: slotType,
      scheduledSlotLabel: slotLabel,
      rating,
      review: review.trim(),
      cost: cost.trim() || undefined,
    });

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });

    setIsManualModalOpen(false);
    setName('');
    setReview('');
    setCost('');
  };

  const handleUpdateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    completeRestaurant(editingItem.id, {
      eatenDate,
      rating,
      review: review.trim(),
      cost: cost.trim() || undefined,
    });

    setEditingItem(null);
  };

  const openEditModal = (item: Restaurant) => {
    setEditingItem(item);
    setEatenDate(item.eatenDate || item.scheduledDate || new Date().toISOString().split('T')[0]);
    setRating(item.rating || 5);
    setReview(item.review || '');
    setCost(item.cost !== undefined ? String(item.cost) : '');
  };

  const handleRevisit = (item: Restaurant) => {
    revisitRestaurant(item.id);
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.7 }
    });
    alert(`🎉 已成功将【${item.name}】再度放回「美食心愿单」待排池！`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5 text-amber-200" />
            <span>美食足迹与打卡日记</span>
          </div>
          <h2 className="text-2xl font-black">
            {roomState?.user1Name || '我'} & {roomState?.user2Name || 'TA'} 吃过的店
          </h2>
          <p className="text-xs text-white/90 mt-1">
            记录每一次舌尖上的约定，每一次打卡都是专属的美味回忆！
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/20 backdrop-blur-xs rounded-2xl px-4 py-2.5 text-center border border-white/25">
            <div className="text-2xl font-black">{stats.total}</div>
            <div className="text-[11px] text-white/80 font-medium">累计打卡 (顿)</div>
          </div>
          <div className="bg-white/20 backdrop-blur-xs rounded-2xl px-4 py-2.5 text-center border border-white/25">
            <div className="text-2xl font-black flex items-center justify-center gap-1">
              <span>{stats.avgRating}</span>
              <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
            </div>
            <div className="text-[11px] text-white/80 font-medium">平均评分</div>
          </div>
          <div className="bg-white/20 backdrop-blur-xs rounded-2xl px-4 py-2.5 text-center border border-white/25">
            <div className="text-base font-black truncate max-w-[90px]">{stats.topCategory}</div>
            <div className="text-[11px] text-white/80 font-medium">最爱菜系</div>
          </div>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-3 rounded-2xl bg-white text-orange-600 hover:bg-orange-50 font-black text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ 补录吃过的店</span>
          </button>
        </div>
      </div>

      {/* Main Content: List of Completed Meals */}
      {completedList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800 mb-1">
            还没有吃过的打卡记录
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
            约饭吃完后，在「已定日程」或「美食心愿单」点击【🎉 打卡吃过】，或者点击右上角【+ 补录吃过的店】记录你们吃过的美食吧！
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>补录第一笔打卡</span>
            </button>
            {onGoToSchedule && (
              <button
                onClick={onGoToSchedule}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                查看已定日程
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completedList.map((item) => {
            const displayDate = item.eatenDate || item.scheduledDate || '';
            const slotInfo = MEAL_SLOTS.find(s => s.type === item.scheduledSlotType);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Date & Slot */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{displayDate ? formatDateWithWeekday(displayDate) : '未记录日期'}</span>
                      </span>
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                        {slotInfo ? `${slotInfo.icon} ${slotInfo.label}` : item.scheduledSlotLabel || '正餐'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        title="修改打卡信息/评价"
                        className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteRestaurant(item.id)}
                        title="删除记录"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Restaurant Info & Stars */}
                  <div className="flex items-start justify-between gap-2 mt-1">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-black text-slate-900">
                          {item.name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                          {item.category}
                        </span>
                      </div>

                      {/* Stars Rating */}
                      <div className="flex items-center gap-1 mt-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= (item.rating || 5)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-slate-700 ml-1">
                          {(item.rating || 5)}.0
                        </span>
                      </div>
                    </div>

                    {item.cost && (
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          ￥{item.cost}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Review / Comments */}
                  {item.review ? (
                    <div className="mt-3 p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{item.review}</p>
                    </div>
                  ) : item.notes ? (
                    <p className="mt-2 text-xs text-slate-500 italic">
                      原备注: {item.notes}
                    </p>
                  ) : null}
                </div>

                {/* Bottom Action: Revisit */}
                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    打卡时间: {new Date(item.completedAt || item.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleRevisit(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-xl border border-orange-200 transition-colors"
                    title="好吃！再次加入美食心愿单待排"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>还想再吃 (放入心愿单)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Add Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-200" />
                <h3 className="text-sm font-black">补录吃过的美食记录</h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  餐厅 / 饮品店名称 *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：川味老火锅 / 楠火锅"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  菜系类型
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {CATEGORY_PRESETS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                        category === cat
                          ? 'bg-orange-500 text-white border-orange-500 font-bold shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {category === '自主填写...' && (
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="输入自定义菜系（例如：东北铁锅炖）"
                    className="w-full text-xs border border-orange-300 rounded-xl px-3 py-2 bg-orange-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    就餐日期
                  </label>
                  <input
                    type="date"
                    required
                    value={eatenDate}
                    onChange={(e) => setEatenDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    就餐时段
                  </label>
                  <select
                    value={slotType}
                    onChange={(e) => setSlotType(e.target.value as MealSlotType)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    {MEAL_SLOTS.map((s) => (
                      <option key={s.type} value={s.type}>
                        {s.icon} {s.label} ({s.timeRange.split(' ')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  美食评分（星级）
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-600 ml-2">
                    {rating === 5 ? '⭐⭐⭐⭐⭐ 封神！超赞' : rating === 4 ? '⭐⭐⭐⭐ 很不错' : rating === 3 ? '⭐⭐⭐ 普通中规中矩' : '一般般'}
                  </span>
                </div>
              </div>

              {/* Review */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  评价 / 瞬间回忆（选填）
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="例如：毛肚脆嫩，双人份量很足！下次一定要再点炸酥肉~"
                  rows={2}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Cost */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  总消费或人均（选填）
                </label>
                <input
                  type="text"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="例如：人均80 / 总计168"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="text-xs px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="text-xs px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xs transition-colors"
                >
                  确认记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4" />
                <h3 className="text-sm font-black">修改打卡信息：{editingItem.name}</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateReview} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  打卡日期
                </label>
                <input
                  type="date"
                  required
                  value={eatenDate}
                  onChange={(e) => setEatenDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  美食评分
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-600 ml-2">
                    {rating} 星
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  评价 / 回忆备注
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="评价一下味道或留下值得纪念的小事..."
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  消费金额（选填）
                </label>
                <input
                  type="text"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="如：人均85"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="text-xs px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="text-xs px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xs transition-colors"
                >
                  保存更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
