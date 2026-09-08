import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { MEAL_SLOTS } from '../types';
import type { MealSlotType, Restaurant } from '../types';
import { formatDateWithWeekday } from '../utils/dateHelpers';
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Sparkles,
  Flame,
  Star,
  Coffee,
  Bookmark,
  CalendarCheck,
  RotateCcw,
  CheckCircle2,
  Tag
} from 'lucide-react';

const CATEGORY_PRESETS = [
  '火锅', '烤肉/烧烤', '日料居酒屋', '西餐酒吧',
  '川湘菜', '粤菜早茶', '咖啡甜品', '小吃排档',
  '自助/自主', '自主填写...'
];

export const RestaurantList: React.FC = () => {
  const {
    roomState,
    addRestaurant,
    updateRestaurant,
    deleteRestaurant,
    unscheduleRestaurant,
    openScheduler,
  } = useSocket();

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('火锅');
  const [customCategory, setCustomCategory] = useState('');
  const [priority, setPriority] = useState<number>(1);
  const [preferredSlotType, setPreferredSlotType] = useState<'any' | MealSlotType>('dinner');
  const [notes, setNotes] = useState('');

  // Editing state
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('火锅');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editPriority, setEditPriority] = useState<number>(1);
  const [editPreferredSlotType, setEditPreferredSlotType] = useState<'any' | MealSlotType>('dinner');
  const [editNotes, setEditNotes] = useState('');

  const restaurants = roomState?.restaurants || [];

  const startEditing = (r: Restaurant) => {
    setEditingRestaurant(r);
    setEditName(r.name);
    if (CATEGORY_PRESETS.includes(r.category)) {
      setEditCategory(r.category);
      setEditCustomCategory('');
    } else {
      setEditCategory('自主填写...');
      setEditCustomCategory(r.category);
    }
    setEditPriority(r.priority);
    setEditPreferredSlotType(r.preferredSlotType || 'any');
    setEditNotes(r.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant || !editName.trim()) return;

    const finalCategory = editCategory === '自主填写...'
      ? (editCustomCategory.trim() || '自主')
      : editCategory;

    updateRestaurant(editingRestaurant.id, {
      name: editName.trim(),
      category: finalCategory,
      priority: editPriority,
      preferredSlotType: editPreferredSlotType,
      notes: editNotes.trim(),
    });

    setEditingRestaurant(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category === '自主填写...'
      ? (customCategory.trim() || '自主')
      : category;

    addRestaurant({
      name: name.trim(),
      category: finalCategory,
      priority,
      preferredSlotType,
      notes: notes.trim(),
    });

    setName('');
    setCustomCategory('');
    setNotes('');
    setIsAdding(false);
  };

  const getPriorityBadge = (p: number) => {
    switch (p) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <Flame className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>P1 必吃</span>
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
            <Star className="w-3 h-3 text-orange-500 fill-orange-400" />
            <span>P2 很想吃</span>
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Coffee className="w-3 h-3 text-blue-500" />
            <span>P3 想尝试</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-slate-600 bg-slate-100 border border-slate-200">
            <Bookmark className="w-3 h-3 text-slate-400" />
            <span>P4 备选</span>
          </span>
        );
    }
  };

  const pendingRestaurants = restaurants.filter(r => r.status === 'pending');
  const scheduledRestaurants = restaurants.filter(r => r.status === 'scheduled');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-bold text-slate-800">
              美食心愿单
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              共 {restaurants.length} 家
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            记录两人想吃的店与优先级，算法将优先为高优先级餐厅匹配空闲时间
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingRestaurants.length > 0 && (
            <button
              onClick={openScheduler}
              className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>开始智能排期 ({pendingRestaurants.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? '收起表单' : '添加餐厅'}</span>
          </button>
        </div>
      </div>

      {/* Add Form Collapse */}
      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 bg-orange-50/50 border-b border-orange-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                餐厅 / 饮品店名称 *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：海底捞 (某某大厦店) / XX居酒屋"
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                菜系分类
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {CATEGORY_PRESETS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {category === '自主填写...' && (
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="输入自主菜系（如：螺蛳粉/烘焙）"
                  className="mt-1.5 w-full text-xs border border-orange-300 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 animate-in fade-in"
                />
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                想吃优先级
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value={1}>🔥 P1 必吃 (最优先排期)</option>
                <option value={2}>⭐ P2 很想吃</option>
                <option value={3}>☕ P3 想尝试</option>
                <option value={4}>📝 P4 备选候选</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Preferred Slot */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                推荐就餐时段偏好
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreferredSlotType('any')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                    preferredSlotType === 'any'
                      ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  任意时段
                </button>
                {MEAL_SLOTS.map((slot) => (
                  <button
                    key={slot.type}
                    type="button"
                    onClick={() => setPreferredSlotType(slot.type)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                      preferredSlotType === slot.type
                        ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{slot.icon}</span>
                    <span>{slot.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                备注 (人均/招牌菜/是否需预约等)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如：需提前1天订座 / 人均160 / 招牌寿喜烧"
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="text-xs px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors shadow-xs"
            >
              加入心愿单
            </button>
          </div>
        </form>
      )}

      {/* List content */}
      <div className="p-4 space-y-4">
        {restaurants.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">心愿单还是空的</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              快添加你们想吃的美食店吧！输入店名和想吃优先级，接着点击“智能排期”即可自动排定时间。
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>添加第一家餐厅</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Pending Restaurants */}
            {pendingRestaurants.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>待排期清单 (按优先级顺位)</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    排期时将优先从顶部第一顺位开始推荐
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {pendingRestaurants.map((restaurant, idx) => (
                    <div
                      key={restaurant.id}
                      className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between transition-all group shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-800">
                                {restaurant.name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 font-medium">
                                {restaurant.category}
                              </span>
                            </div>
                            {restaurant.notes && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                                💬 {restaurant.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditing(restaurant)}
                            title="修改信息"
                            className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteRestaurant(restaurant.id)}
                            title="删除"
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(restaurant.priority)}
                          <span className="text-[11px] text-slate-400">
                            {restaurant.preferredSlotType === 'any'
                              ? '时段: 任意'
                              : `偏好: ${MEAL_SLOTS.find(s => s.type === restaurant.preferredSlotType)?.label}`}
                          </span>
                        </div>
                        <span className="text-[11px] text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                          待排期
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Restaurants */}
            {scheduledRestaurants.length > 0 && (
              <div className="pt-3 space-y-2">
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>已敲定日程 ({scheduledRestaurants.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {scheduledRestaurants.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 flex flex-col justify-between transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-emerald-900">
                              {restaurant.name}
                            </span>
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                              {restaurant.category}
                            </span>
                            {restaurant.notes && (
                              <p className="text-[11px] text-emerald-700/80 mt-0.5 line-clamp-1">
                                💬 {restaurant.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditing(restaurant)}
                            title="修改信息/备注"
                            className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => unscheduleRestaurant(restaurant.id)}
                            title="撤回排期并重新放入待排池"
                            className="text-xs text-slate-400 hover:text-orange-600 p-1 rounded-lg hover:bg-orange-50 flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span className="text-[10px]">撤回</span>
                          </button>
                          <button
                            onClick={() => deleteRestaurant(restaurant.id)}
                            title="删除"
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-100">
                        <div className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span>📅</span>
                          <span>{restaurant.scheduledDate ? formatDateWithWeekday(restaurant.scheduledDate) : ''}</span>
                          <span>{restaurant.scheduledSlotLabel}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          已定
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Restaurant Modal */}
      {editingRestaurant && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4" />
                <h3 className="text-sm font-black">编辑餐厅 / 饮品店信息</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRestaurant(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  餐厅 / 饮品店名称 *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="例如：海底捞 / 某某日料居酒屋"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  菜系 / 类型分类
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {CATEGORY_PRESETS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditCategory(cat)}
                      className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                        editCategory === cat
                          ? 'bg-orange-500 text-white border-orange-500 font-bold shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {editCategory === '自主填写...' && (
                  <input
                    type="text"
                    required
                    value={editCustomCategory}
                    onChange={(e) => setEditCustomCategory(e.target.value)}
                    placeholder="请输入自定义菜系（例如：云南酸汤火锅 / 东北铁锅炖）"
                    className="w-full text-xs border border-orange-300 rounded-xl px-3 py-2 bg-orange-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  想吃优先级（算法将优先推荐高优先级餐厅）
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { p: 1, label: 'P1 必吃', desc: '心心念念', color: 'border-rose-300 bg-rose-50 text-rose-800' },
                    { p: 2, label: 'P2 很想吃', desc: '近期必打卡', color: 'border-orange-300 bg-orange-50 text-orange-800' },
                    { p: 3, label: 'P3 想尝试', desc: '尝鲜种草', color: 'border-blue-300 bg-blue-50 text-blue-800' },
                    { p: 4, label: 'P4 备选', desc: '有空再去', color: 'border-slate-300 bg-slate-50 text-slate-800' },
                  ].map(({ p, label, desc, color }) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPriority(p)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        editPriority === p
                          ? `${color} ring-2 ring-orange-400 font-bold shadow-xs`
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold">{label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Slot */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  时段偏好
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditPreferredSlotType('any')}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                      editPreferredSlotType === 'any'
                        ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✨ 任意时段均可
                  </button>
                  {MEAL_SLOTS.map((slot) => (
                    <button
                      key={slot.type}
                      type="button"
                      onClick={() => setEditPreferredSlotType(slot.type)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                        editPreferredSlotType === slot.type
                          ? 'bg-orange-500 text-white border-orange-500 font-bold shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{slot.icon}</span>
                      <span>{slot.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  备注 / 人均 / 种草理由（选填）
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="例如：人均80，周五有双人团购套餐 / 必点招牌提拉米苏"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRestaurant(null)}
                  className="text-xs px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="text-xs px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xs transition-colors"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
