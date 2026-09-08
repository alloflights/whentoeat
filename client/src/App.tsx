import React, { useState, useMemo } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Header } from './components/Header';
import { AvailabilityGrid } from './components/AvailabilityGrid';
import { RestaurantList } from './components/RestaurantList';
import { SchedulerModal } from './components/SchedulerModal';
import { FinalSchedule } from './components/FinalSchedule';
import { DiningHistory } from './components/DiningHistory';
import { Sparkles, Heart } from 'lucide-react';

const MainDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'main' | 'schedule' | 'history'>('main');
  const [showGuide, setShowGuide] = useState(true);
  const { isSchedulerOpen, closeScheduler, openScheduler, roomState } = useSocket();

  const pendingCount = roomState?.restaurants.filter(r => r.status === 'pending').length || 0;
  const scheduledCount = roomState?.restaurants.filter(r => r.status === 'scheduled').length || 0;
  const completedCount = roomState?.restaurants.filter(r => r.status === 'completed').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-slate-50 flex flex-col text-slate-900 pb-20 md:pb-0">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Quick Guide Card */}
        {showGuide && activeTab === 'main' && (
          <div className="relative bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-orange-200/70 rounded-2xl p-4 shadow-2xs">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-xs px-2 py-0.5 rounded-md hover:bg-black/5"
            >
              我知道了 ✕
            </button>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1.5 pr-12">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <span>双人协同约饭玩法介绍</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-orange-200 text-orange-800 font-semibold">
                    实时同步
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-slate-600 pt-0.5">
                  <div className="flex items-start gap-1.5 bg-white/70 p-2 rounded-xl border border-orange-100/60">
                    <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                    <span><strong>认领身份</strong>：右上角切换“我”或“TA”，支持自定义昵称。</span>
                  </div>
                  <div className="flex items-start gap-1.5 bg-white/70 p-2 rounded-xl border border-orange-100/60">
                    <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                    <span><strong>勾选空闲</strong>：在时间表勾选各自有空时段，系统秒标<strong>双方均有空</strong>。</span>
                  </div>
                  <div className="flex items-start gap-1.5 bg-white/70 p-2 rounded-xl border border-orange-100/60">
                    <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                    <span><strong>填想吃清单</strong>：添加想吃的餐厅，并设置 P1~P4 优先级。</span>
                  </div>
                  <div className="flex items-start gap-1.5 bg-white/70 p-2 rounded-xl border border-orange-100/60">
                    <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center justify-center shrink-0">4</span>
                    <span><strong>步进排期</strong>：点击“智能排期”，排完一个确认后扣减时段，紧接排下一个！</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Switching */}
        {activeTab === 'main' && (
          <div className="space-y-6">
            {/* Section 1: Availability Matrix */}
            <section>
              <AvailabilityGrid />
            </section>

            {/* Section 2: Restaurant Wishlist */}
            <section>
              <RestaurantList />
            </section>
          </div>
        )}

        {activeTab === 'schedule' && (
          <section>
            <FinalSchedule onBackToMain={() => setActiveTab('main')} />
          </section>
        )}

        {activeTab === 'history' && (
          <section>
            <DiningHistory onGoToSchedule={() => setActiveTab('schedule')} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-100">
        <p className="flex items-center justify-center gap-1">
          <span>EatTogether 共同操作约饭排期助手</span>
          <span>•</span>
          <span className="flex items-center gap-0.5 text-rose-500">
            用美食记录生活 <Heart className="w-3 h-3 fill-rose-500 inline" />
          </span>
        </p>
      </footer>

      {/* Mobile Floating Bottom Action Bar */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-xl border border-orange-100 flex items-center justify-between gap-1">
        <button
          onClick={() => setActiveTab('main')}
          className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeTab === 'main'
              ? 'bg-orange-50 text-orange-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>工作台</span>
        </button>

        <button
          onClick={openScheduler}
          disabled={pendingCount === 0}
          className={`py-2 px-3 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1 shadow-md ${
            pendingCount > 0
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-200'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>排期</span>
          {pendingCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-orange-600 text-[10px] flex items-center justify-center font-black">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeTab === 'schedule'
              ? 'bg-orange-50 text-orange-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>已定</span>
          {scheduledCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">
              {scheduledCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeTab === 'history'
              ? 'bg-rose-50 text-rose-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>足迹</span>
          {completedCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
              {completedCount}
            </span>
          )}
        </button>
      </div>

      {/* Step-by-Step Auto Scheduler Modal */}
      <SchedulerModal
        isOpen={isSchedulerOpen}
        onClose={closeScheduler}
        onViewSchedule={() => {
          closeScheduler();
          setActiveTab('schedule');
        }}
      />
    </div>
  );
};

export default function App() {
  const roomId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('room');
    if (id) return id;
    // Set default friendly room if none in URL
    return 'weekend-foodies';
  }, []);

  return (
    <SocketProvider roomId={roomId}>
      <MainDashboard />
    </SocketProvider>
  );
}
