import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Smartphone } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  roomName: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, url, roomName }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && url) {
      QRCode.toDataURL(url, {
        width: 260,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white relative text-center">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-1.5 shadow-xs">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-base font-bold">微信 / 手机扫码直达</h3>
          <p className="text-xs text-white/80 mt-0.5">
            房间：<code className="bg-white/20 px-1 py-0.2 rounded font-mono text-[11px]">{roomName}</code>
          </p>
        </div>

        {/* QR Code Body */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-white rounded-2xl border-2 border-orange-100 shadow-md">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Room QR Code" className="w-52 h-52 object-contain" />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                正在生成二维码...
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800">
              用手机微信扫一扫，免登录即刻协同！
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
              两人各持一台手机，一人认领“我”，一人认领“TA”，随时随地共同勾选时间、安排餐厅。
            </p>
          </div>

          {/* Copy Link Button */}
          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '房间链接已复制到剪贴板！' : '复制房间链接发送给TA'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
