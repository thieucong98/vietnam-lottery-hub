import React from 'react';
import { CheckCircle2, Trophy } from 'lucide-react';
import { useTicketFilter } from './useTicketFilter';
import { VietlottFilterPanel } from './VietlottFilterPanel';
import { XsmbMultiCheckPanel } from './XsmbMultiCheckPanel';
export type { SmartFilterAndCheckerProps } from './useTicketFilter';
import type { SmartFilterAndCheckerProps } from './useTicketFilter';

export const SmartFilterAndChecker: React.FC<SmartFilterAndCheckerProps> = (props) => {
  const model = useTicketFilter(props);
  const { activeSubTab, setActiveSubTab, latestXSMB, specialPrizeNumber } = model;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Navigation Switch Sub-tabs */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 4 }}>
          <button
            onClick={() => setActiveSubTab('vietlott_filter')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeSubTab === 'vietlott_filter' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'transparent',
              color: activeSubTab === 'vietlott_filter' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            <Trophy size={16} />
            <span>Tạo & Lọc Vé Vietlott</span>
          </button>

          <button
            onClick={() => setActiveSubTab('checker')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeSubTab === 'checker' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'transparent',
              color: activeSubTab === 'checker' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            <CheckCircle2 size={16} />
            <span>Thống Kê Nhiều Số XSMB</span>
          </button>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
          {activeSubTab === 'vietlott_filter'
            ? 'Lọc theo phân phối tổng & cặp đồng xuất hiện. Không làm tăng xác suất trúng.'
            : `Kỳ quay đối soát: ${latestXSMB?.date || 'Mới nhất'} (Đặc biệt: ${specialPrizeNumber || '--'})`}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. VIEW: TẠO & LỌC VÉ VIETLOTT                           */}
      {/* ========================================================= */}
      {activeSubTab === 'vietlott_filter' && <VietlottFilterPanel model={model} />}

      {/* ========================================================= */}
      {/* 3. VIEW: THỐNG KÊ NHIỀU SỐ 2 CHỮ SỐ TRONG KỲ XSMB MỚI NHẤT */}
      {/* ========================================================= */}
      {activeSubTab === 'checker' && <XsmbMultiCheckPanel model={model} />}
    </div>
  );
};

