import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Users, Sparkles, Calendar, Check, Edit2, Share2, UtensilsCrossed, QrCode } from 'lucide-react';
import { QRCodeModal } from './QRCodeModal';

interface HeaderProps {
  activeTab: 'main' | 'schedule';
  setActiveTab: (tab: 'main' | 'schedule') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const {
    roomState,
    activeCount,
    currentUserRole,
    setCurrentUserRole,
    openScheduler,
    updateProfile,
  } = useSocket();

  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [user1Input, setUser1Input] = useState(roomState?.user1Name || '我');
  const [user2Input, setUser2Input] = useState(roomState?.user2Name || 'TA');

  const pendingCount = roomState?.restaurants.filter(r => r.status === 'pending').length || 0;
  const scheduledCount = roomState?.restaurants.filter(r => r.status === 'scheduled').length || 0;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNames = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(user1Input.trim() || '我', user2Input.trim() || 'TA');
    setIsEditingNames(false);
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-orange-100 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Room title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-200">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 bg-clip-text text-transparent">
                    EatTogether
                  </h1>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
                    双人约饭助手
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{activeCount} 人正在协同</span>
                  <span className="text-slate-300">|</span>
                  <span>房间: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">{roomState?.roomId || 'default'}</code></span>
                </p>
              </div>
            </div>

            {/* Action buttons (mobile) */}
            <div className="md:hidden flex items-center gap-1.5">
              <button
                onClick={() => setIsQrOpen(true)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                title="手机扫码"
              >
                <QrCode className="w-4 h-4 text-orange-600" />
              </button>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? '已复制' : '分享'}</span>
              </button>
            </div>
          </div>

          {/* User Role Switcher & Nicknames */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-medium border border-slate-200/80">
              <span className="px-2 text-slate-400 select-none">我是:</span>
              <button
                onClick={() => setCurrentUserRole('user1')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentUserRole === 'user1'
                    ? 'bg-rose-500 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-200"></span>
                <span>{roomState?.user1Name || '我'}</span>
              </button>
              <button
                onClick={() => setCurrentUserRole('user2')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentUserRole === 'user2'
                    ? 'bg-sky-500 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-200"></span>
                <span>{roomState?.user2Name || 'TA'}</span>
              </button>
              <button
                onClick={() => {
                  setUser1Input(roomState?.user1Name || '我');
                  setUser2Input(roomState?.user2Name || 'TA');
                  setIsEditingNames(true);
                }}
                title="修改双方昵称"
                className="p-1.5 ml-0.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Share Link button (desktop) */}
            <button
              onClick={handleCopyLink}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-500" />}
              <span>{copied ? '链接已复制！' : '邀请TA协同'}</span>
            </button>

            {/* QR Scan Button (desktop) */}
            <button
              onClick={() => setIsQrOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200 text-xs font-semibold text-orange-700 bg-orange-50/70 hover:bg-orange-100/70 transition-colors shadow-2xs"
            >
              <QrCode className="w-4 h-4 text-orange-600" />
              <span>手机扫码</span>
            </button>

            {/* Smart Schedule button */}
            <button
              onClick={openScheduler}
              disabled={pendingCount === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                pendingCount > 0
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-200 hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>智能排期</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 bg-white/25 rounded-full text-[11px]">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Schedule View Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('main')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'main'
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                排期工作台
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'schedule'
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>已定日程</span>
                {scheduledCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {scheduledCount}
                  </span>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Edit Names Modal */}
      {isEditingNames && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              <span>修改双方昵称</span>
            </h3>
            <form onSubmit={handleSaveNames} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  User 1 昵称（粉色）:
                </label>
                <input
                  type="text"
                  value={user1Input}
                  onChange={(e) => setUser1Input(e.target.value)}
                  maxLength={10}
                  placeholder="例如：我 / 小陈"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  User 2 昵称（蓝色）:
                </label>
                <input
                  type="text"
                  value={user2Input}
                  onChange={(e) => setUser2Input(e.target.value)}
                  maxLength={10}
                  placeholder="例如：TA / 猪猪"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingNames(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal for Mobile / WeChat */}
      <QRCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={window.location.href}
        roomName={roomState?.roomId || 'default'}
      />
    </header>
  );
};
