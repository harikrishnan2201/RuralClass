import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Storage } from '../../lib/storage';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(Storage.isOffline());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleNetworkChange = () => {
      setIsOffline(Storage.isOffline());
    };
    window.addEventListener('ruralclass_network_status_change', handleNetworkChange);
    return () => window.removeEventListener('ruralclass_network_status_change', handleNetworkChange);
  }, []);

  const handleRetrySync = async () => {
    setIsSyncing(true);
    try {
      await Storage.syncWithServer();
    } finally {
      setIsSyncing(false);
      setIsOffline(Storage.isOffline());
    }
  };

  if (!isOffline) return null;

  return (
    <aside
      aria-label="Offline Mode Notification"
      className="bg-[#FFF8E7] border-b border-[#F7E2B5] px-4 py-2 text-xs text-[#9A6208] flex items-center justify-between gap-3 shadow-2xs transition-all duration-200"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-[#D97706] shrink-0" />
        <span>
          <strong>Offline Mode:</strong> Working from local cache. All edits are saved locally and will sync to the server when reconnected.
        </span>
      </div>

      <button
        onClick={handleRetrySync}
        disabled={isSyncing}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-[#F7E2B5] text-[#9A6208] hover:bg-[#FEF8ED] text-xs font-medium cursor-pointer transition-colors shrink-0 disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
        <span>{isSyncing ? 'Checking...' : 'Check Connection'}</span>
      </button>
    </aside>
  );
};

