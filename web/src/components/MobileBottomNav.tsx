import React, { useId, useState } from 'react';
import {
  Calendar,
  Dices,
  Search,
  Settings,
  Zap,
  BarChart3,
  X,
  Flame,
  Sparkles,
  Filter,
  Brain,
  ShieldCheck,
  ChevronRight,
  ListChecks,
} from 'lucide-react';
import { useDialogBehavior } from '../ui/useDialogBehavior';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenLegal?: () => void;
  onOpenSettings: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSearch,
  onOpenLegal,
  onOpenSettings,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerTitleId = useId();
  const drawerRef = useDialogBehavior<HTMLDivElement>(isDrawerOpen, () => setIsDrawerOpen(false));

  const isHomeActive = currentTab === 'xsmb';
  const isVietlottActive =
    currentTab === 'vietlott_655' ||
    currentTab === 'vietlott_645';
  const isKenoActive = currentTab === 'keno_3d';
  const isMoreActive = [
    'heatmap',
    'gan',
    'analysis',
    'bacnho',
    'filter',
    'ai',
    'tools',
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
          title="Phân tích, thống kê có điều kiện, phòng thí nghiệm & bộ lọc"
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
            ref={drawerRef}
            className="mobile-drawer-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
            tabIndex={-1}
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
                  id={drawerTitleId}
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
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
                aria-label="Đóng"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--bg-glass)',
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

              {/* Option: Dò vé & tiện ích (Phase 3) */}
              <button
                onClick={() => handleSelectTab('tools')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: currentTab === 'tools' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: currentTab === 'tools' ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
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
                    <ListChecks size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Dò Vé & Tiện Ích</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Dò nhiều vé, Vé của tôi, lịch quay & Jackpot, ngân sách
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
                  color: 'var(--text-main)',
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
                      Bản đồ tần suất nhiệt 100 số (2 chữ số) 20 năm
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
                  color: 'var(--text-main)',
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

              {/* Option: Phân tích minh bạch */}
              <button
                onClick={() => handleSelectTab('analysis')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background:
                    currentTab === 'analysis'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border:
                    currentTab === 'analysis'
                      ? '1px solid var(--accent-emerald)'
                      : '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
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
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      Phân Tích Minh Bạch
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Tần suất, khoảng cách, tổng, chẵn/lẻ và kiểm định ngẫu nhiên
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-dim)" />
              </button>

              {/* Option: Thống kê có điều kiện */}
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
                  color: 'var(--text-main)',
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
                      color: 'var(--accent-purple-on-tint)',
                    }}
                  >
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      Thống Kê Có Điều Kiện
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Tỷ lệ ngày kế tiếp so với tần suất nền, kèm cỡ mẫu
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
                  color: 'var(--text-main)',
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
                      Bộ Lọc Vé Theo Phân Phối Tổng
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Lọc vé Vietlott & thống kê nhiều số (không làm tăng xác suất trúng)
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
                  color: 'var(--text-main)',
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
                      Phòng Thí Nghiệm Xác Suất
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Thuật toán so với 1.000 lần chọn ngẫu nhiên, kèm p-value
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-dim)" />
              </button>

              {/* Option: Giao diện & cỡ chữ */}
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenSettings();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
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
                      background: 'var(--bg-glass)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Settings size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Giao Diện & Cỡ Chữ</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Chọn theme sáng/tối và cỡ chữ dễ đọc
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
                    color: 'var(--accent-emerald-on-tint)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginTop: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ShieldCheck size={20} color="var(--accent-emerald)" />
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
