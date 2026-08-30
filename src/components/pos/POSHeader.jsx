import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/common/Button';
import { Camera, Clock, User, ShieldCheck, UserCheck } from 'lucide-react';

export function POSHeader({ onOpenScanner }) {
  const { profile, role } = useAuthStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = time.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Terminal Info */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Terminal Kasir / POS
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1 font-medium">
                {role === 'owner' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                )}
                {profile?.full_name || 'Kasir'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                {formattedDate}, {formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Barcode Scanner Trigger Button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            icon={Camera}
            onClick={onOpenScanner}
            className="w-full sm:w-auto shadow-sm shadow-blue-500/20 text-xs sm:text-sm py-2.5 font-bold"
          >
            Scan Barcode (Kamera)
          </Button>
        </div>
      </div>
    </header>
  );
}

export default POSHeader;
