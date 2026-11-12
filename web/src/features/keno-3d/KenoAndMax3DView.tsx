import React from 'react';
import { Zap, Sparkles, Dices } from 'lucide-react';
import { OfficialResultsLink } from '../../components/OfficialResultsLink';
import { useKeno3D } from './useKeno3D';
import { KenoPanel } from './KenoPanel';
import { Max3DPanel } from './Max3DPanel';
export type { KenoAndMax3DViewProps } from './useKeno3D';
import type { KenoAndMax3DViewProps } from './useKeno3D';

export const KenoAndMax3DView: React.FC<KenoAndMax3DViewProps> = (props) => {
  const model = useKeno3D(props);
  const { subTab, setSubTab } = model;
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* HEADER & TABS CHUYỂN ĐỔI GAME */}
      <div
        className="glass-card"
        style={{
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            className="lottery-ball ball-gold"
            style={{ width: 50, height: 50, fontSize: '1.3rem', boxShadow: '0 0 25px rgba(245, 158, 11, 0.4)' }}
          >
            <Zap size={24} color="#0f172a" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                TRUNG TÂM VIETLOTT KENO & MAX 3D / 3D PRO
              </h2>
              <span className="badge badge-hot">QUAY NHANH & 3 CHỮ SỐ</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Theo dõi kết quả Keno 10 phút/kỳ (20 số bóng, tỷ lệ Chẵn/Lẻ/Tài/Xỉu) và cơ cấu giải thưởng bộ ba số Max 3D & Max 3D Pro.
            </p>
          </div>
        </div>

        {/* Nút Tab Chuyển Đổi 3 Trò Chơi */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(0, 0, 0, 0.3)', padding: 5, borderRadius: 'var(--radius-md)' }}>
          <button
            className={`tab-btn ${subTab === 'keno' ? 'active' : ''}`}
            onClick={() => setSubTab('keno')}
            style={{ fontSize: '0.86rem', padding: '8px 18px' }}
          >
            <Zap size={16} />
            <span>Keno (20 Bóng)</span>
          </button>
          <button
            className={`tab-btn ${subTab === 'max3d' ? 'active' : ''}`}
            onClick={() => setSubTab('max3d')}
            style={{ fontSize: '0.86rem', padding: '8px 18px' }}
          >
            <Dices size={16} />
            <span>Max 3D</span>
          </button>
          <button
            className={`tab-btn ${subTab === 'max3d_pro' ? 'active' : ''}`}
            onClick={() => setSubTab('max3d_pro')}
            style={{ fontSize: '0.86rem', padding: '8px 18px' }}
          >
            <Sparkles size={16} color="var(--accent-gold)" />
            <span>Max 3D Pro</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          PHÂN HỆ 1: VIETLOTT KENO (QUAY NHANH 10 PHÚT/KỲ)
          ======================================================== */}
      {subTab === 'keno' && <KenoPanel model={model} />}

      {/* ========================================================
          PHÂN HỆ 2: VIETLOTT MAX 3D & MAX 3D PRO
          ======================================================== */}
      {(subTab === 'max3d' || subTab === 'max3d_pro') && <Max3DPanel model={model} />}
      <OfficialResultsLink sources={['vietlott']} />
    </div>
  );
};

