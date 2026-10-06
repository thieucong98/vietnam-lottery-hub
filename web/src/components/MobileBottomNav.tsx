import React, { useState } from 'react';
import {
  Calendar,
  Dices,
  Search,
  Zap,
  BarChart3,
  X,
  Flame,
  Sparkles,
  Filter,
  Brain,
  ShieldCheck,
  ChevronRight,
  Trophy,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenLegal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSearch,
  onOpenLegal,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isHomeActive = currentTab === 'xsmb';
  const isVietlottActive =
    currentTab === 'vietlott_655' ||
    currentTab === 'vietlott_645' ||
    currentTab === 'vietlott_combo';
  const isKenoActive = currentTab === 'keno_3d';
  const isMoreActive = [
    'heatmap',
    'gan',
    'bacnho',
    'filter',
    'ai',
  ].includes(currentTab);

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* THANH ĐIỀU HƯỚNG DƯỚI ĐÁY (CHỈ HIỂN THỊ TRÊN MÀN HÌNH < 900PX) */}
      <nav className="mobile-bottom-bar hide-desktop" aria-label="Mobile Navigation">
        {/* 1. Trang Chủ (XSMB) */}
        <button
          className={`mobile-nav-item ${isHomeActive ? 'active' : ''}`}
          onClick={() => handleSelectTab('xsmb')}
          title="Trang Chủ & XSMB"
        >
          <div className="nav-icon-wrapper">
            <Calendar size={20} />
          </div>
          <span>XSMB</span>
        </button>

        {/* 2. Vietlott */}
        <button
          className={`mobile-nav-item ${isVietlottActive ? 'active' : ''}`}
          onClick={() => handleSelectTab('vietlott_655')}
          title="Vietlott Power & Mega"
        >
          <div className="nav-icon-wrapper">
            <Dices size={20} />
          </div>
          <span>Vietlott</span>
        </button>

        {/* 3. NÚT TÂM ĐIỂM: DÒ VÉ SIÊU TỐC */}
        <button
          className="mobile-nav-center-action"
          onClick={onOpenSearch}
          title="Dò vé & Tra cứu tức thì"
        >
          <Search size={22} color="#0f172a" strokeWidth={2.5} />
        </button>

        {/* 4. Keno & Max 3D */}
        <button
          className={`mobile-nav-item ${isKenoActive ? 'active' : ''}`}
          onClick={() => handleSelectTab('keno_3d')}
          title="Keno & Max 3D"
        >
          <div className="nav-icon-wrapper">
            <Zap size={20} color={isKenoActive ? 'var(--accent-gold)' : undefined} />
          </div>
          <span>Keno & 3D</span>
        </button>

        {/* 5. Menu Thống Kê Mở Rộng */}
        <button
          className={`mobile-nav-item ${isMoreActive ? 'active' : ''}`}
          onClick={() => setIsDrawerOpen(true)}
          title="Thống kê, Bạc nhớ, AI & Bộ lọc"
        >
          <div className="nav-icon-wrapper">
            <BarChart3 size={20} />
          </div>
          <span>Thống Kê</span>
        </button>
      </nav>

      {/* DRAWER MENU MỞ RỘNG TRÊN DI ĐỘNG */}
      {isDrawerOpen && (
        <div
          className="mobile-drawer-overlay hide-desktop"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="mobile-drawer-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: 16,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Trung Tâm Phân Tích & Tiện Ích
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Chọn công cụ tra cứu & giải thuật toán học
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Options Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Option: Bộ Số Vietlott */}
              <button
                onClick={() => handleSelectTab('vietlott_combo')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background:
                    currentTab === 'vietlott_combo'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border:
                    currentTab === 'vietlott_combo'
                      ? '1px solid var(--accent-gold)'
                      : '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-gold)',
                    }}
                  >
                    <Trophy size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      Tra Cứu Bộ Số & Vé Bao
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      So khớp vé 2 - 18 số với toàn bộ lịch sử Vietlott
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-dim)" />
              </button>

              {/* Option: Ma Trận Nhiệt */}
              <button
                onClick={() => handleSelectTab('heatmap')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background:
                    currentTab === 'heatmap'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border:
                    currentTab === 'heatmap'
                      ? '1px solid var(--accent-red)'
                      : '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(239, 68, 68, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-red)',
                    }}
                  >
                    <Flame size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      Ma Trận Nhiệt (00 - 99)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Bản đồ tần suất nhiệt 100 số đề & loto 20 năm
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-dim)" />
              </button>

              {/* Option: Lô Gan */}
              <button
                onClick={() => handleSelectTab('gan')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background:
                    currentTab === 'gan'
                      ? 'rgba(6, 182, 212, 0.15)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border:
                    currentTab === 'gan'
                      ? '1px solid var(--accent-cyan)'
                      : '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(6, 182, 212, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      Lô Gan & Chu Kỳ Nhịp
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Xếp hạng các số lì nhất và chu kỳ trung bình
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-dim)" />
              </button>

              {/* Option: Bạc Nhớ 20 Năm */}
              <button
                onClick={() => handleSelectTab('bacnho')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background:
                    currentTab === 'bacnho'
                      ? 'rgba(168, 85, 247, 0.15)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border:
                    currentTab === 'bacnho'
                      ? '1px solid var(--accent-purple)'
                      : '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(168, 85, 247, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#c084fc',
                    }}
                  >
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      Bạc Nhớ Ma Trận 20 Năm
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Quy luật số về theo sau từ 7,500+ kỳ quay
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-dim)" />
              </button>

              {/* Option: Bộ Lọc & So Vé */}
              <button
                onClick={() => handleSelectTab('filter')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background:
                    currentTab === 'filter'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border:
                    currentTab === 'filter'
                      ? '1px solid var(--accent-emerald)'
                      : '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-emerald)',
                    }}
                  >
                    <Filter size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      Bộ Lọc Dàn Vé Chuẩn Gauss
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Tạo vé tối ưu xác suất & so hàng loạt
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-dim)" />
              </button>

              {/* Option: AI & Backtest */}
              <button
                onClick={() => handleSelectTab('ai')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background:
                    currentTab === 'ai'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border:
                    currentTab === 'ai'
                      ? '1px solid var(--accent-gold)'
                      : '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-gold)',
                    }}
                  >
                    <Brain size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      Mô Hình AI & Kiểm Thử Backtest
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Chuỗi Markov, Exponential Decay & Hiệu suất thực tế
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-dim)" />
              </button>

              {/* Option: Pháp lý 18+ */}
              {onOpenLegal && (
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenLegal();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginTop: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ShieldCheck size={20} color="#10b981" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                        Quy Định Pháp Lý & 18+ Chơi Có Trách Nhiệm
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Nghị định 30/2007/NĐ-CP & Nghiêm cấm cờ bạc bất hợp pháp
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} color="var(--text-dim)" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
