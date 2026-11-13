import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button, Card } from '../ui';

const DISMISS_STORAGE_KEY = 'vlh_install_dismissed_v1';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_STORAGE_KEY) === 'yes';
  } catch {
    return false;
  }
}

/** Gợi ý "Thêm vào màn hình chính". Android/desktop dùng beforeinstallprompt; iOS Safari hiện hướng dẫn tay (không có API cài đặt). */
export const InstallPrompt: React.FC = () => {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIosSafari()) {
      // Chờ vài giây để không làm phiền ngay lúc vừa mở trang
      iosTimer = setTimeout(() => setShowIosHint(true), 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, [dismissed]);

  const dismiss = () => {
    setDismissed(true);
    setDeferredEvent(null);
    setShowIosHint(false);
    try {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, 'yes');
    } catch {
      // localStorage bị chặn: chỉ ẩn trong phiên này
    }
  };

  const handleInstall = async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  };

  if (dismissed || (!deferredEvent && !showIosHint)) return null;

  return (
    <Card
      className="glass-card animate-fade-in"
      role="status"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
        zIndex: 110,
        maxWidth: 420,
        margin: '0 auto',
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <button
        onClick={dismiss}
        aria-label="Đóng gợi ý cài đặt"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 32,
          height: 32,
          minWidth: 32,
          minHeight: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-dim)',
          cursor: 'pointer',
        }}
      >
        <X size={16} />
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>Thêm vào màn hình chính</span>
        {deferredEvent ? (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Mở nhanh hơn, xem được kết quả gần nhất khi mất mạng.
          </span>
        ) : (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Trên Safari: bấm nút Chia sẻ <Share size={13} style={{ verticalAlign: 'middle' }} />, chọn "Thêm vào màn hình chính".
          </span>
        )}
      </div>
      {deferredEvent && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <Button variant="emerald" size="sm" icon={<Download size={14} />} onClick={handleInstall}>
            Cài đặt
          </Button>
        </div>
      )}
    </Card>
  );
};
