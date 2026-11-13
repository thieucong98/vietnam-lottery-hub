import React from 'react';
import { CheckCircle2, Calendar } from 'lucide-react';
import { useXsmbHub } from './useXsmbHub';
import { XsmbQuickCheckPanel } from './XsmbQuickCheckPanel';
import { XsmbHistoryPanel } from './XsmbHistoryPanel';
export type { XSMBProductHubProps } from './useXsmbHub';
import type { XSMBProductHubProps } from './useXsmbHub';

export const XSMBProductHub: React.FC<XSMBProductHubProps> = (props) => {
  const model = useXsmbHub(props);
  const { historicalDraws, activeTab, setActiveTab, setHistoryPage } = model;
  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        padding: '20px 24px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card-gradient)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header & Sub-tab switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontWeight: 800,
              fontSize: '0.8rem',
            }}
          >
            TOOLKIT XSMB
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Công Cụ Hỗ Trợ Người Chơi Tại Chỗ
          </h3>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('quick_checker')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              borderColor: activeTab === 'quick_checker' ? 'var(--accent-emerald)' : 'var(--border-subtle)',
              background: activeTab === 'quick_checker' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'quick_checker' ? 'var(--accent-emerald)' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckCircle2 size={15} />
            <span>Dò Vé 1 Giây</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setHistoryPage(1);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              borderColor: activeTab === 'history' ? '#8b5cf6' : 'var(--border-subtle)',
              background: activeTab === 'history' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              color: activeTab === 'history' ? '#c084fc' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Calendar size={15} />
            <span>Lịch Sử Kỳ Quay ({historicalDraws.length})</span>
          </button>
        </div>
      </div>


      {/* 2. QUICK CHECKER */}
      {activeTab === 'quick_checker' && <XsmbQuickCheckPanel model={model} />}

      {/* 3. KHO LỊCH SỬ KỲ QUAY XSMB */}
      {activeTab === 'history' && <XsmbHistoryPanel model={model} />}
    </div>
  );
};


