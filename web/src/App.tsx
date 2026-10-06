import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { LiveResultsBoard } from './components/LiveResultsBoard';
import { InstantLookupModal } from './components/InstantLookupModal';
import { LegalComplianceModal } from './components/LegalComplianceModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { UniversalQuickChecker } from './components/UniversalQuickChecker';
import { BentoInsightsGrid } from './components/BentoInsightsGrid';
import { SkeletonLoader } from './components/SkeletonLoader';
import {
  LotteryIndexData,
  MLInsightsData,
  SummaryData,
  BacNhoData,
  VietlottFullDrawsData,
  VietlottCooccurrenceData,
} from './types';
import { Search, Flame, BarChart3, Database, ShieldCheck, Sparkles, RefreshCw, Scale, AlertTriangle } from 'lucide-react';

// Code Splitting & Lazy Loading cho các Tab phân tích dữ liệu chuyên sâu
const HeatmapMatrix = lazy(() => import('./components/HeatmapMatrix').then((m) => ({ default: m.HeatmapMatrix })));
const GanRankingView = lazy(() => import('./components/GanRankingView').then((m) => ({ default: m.GanRankingView })));
const AIStrategyHub = lazy(() => import('./components/AIStrategyHub').then((m) => ({ default: m.AIStrategyHub })));
const BacNhoHub = lazy(() => import('./components/BacNhoHub').then((m) => ({ default: m.BacNhoHub })));
const SmartFilterAndChecker = lazy(() => import('./components/SmartFilterAndChecker').then((m) => ({ default: m.SmartFilterAndChecker })));
const KenoAndMax3DView = lazy(() => import('./components/KenoAndMax3DView').then((m) => ({ default: m.KenoAndMax3DView })));
const VietlottProductHub = lazy(() => import('./components/VietlottProductHub').then((m) => ({ default: m.VietlottProductHub })));
const XSMBProductHub = lazy(() => import('./components/XSMBProductHub').then((m) => ({ default: m.XSMBProductHub })));

// Component Fallback Loading khi chuyển tab nặng
const TabFallback: React.FC = () => (
  <div className="glass-card animate-fade-in" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 340 }}>
    <div className="lottery-ball ball-gold" style={{ width: 48, height: 48, fontSize: '1.2rem', animation: 'pulse-ring 1.5s infinite' }}>
      88
    </div>
    <div className="skeleton-box" style={{ width: 220, height: 16 }} />
    <div className="skeleton-box" style={{ width: 140, height: 12 }} />
  </div>
);

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('xsmb');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [selectedSearchNumber, setSelectedSearchNumber] = useState<string>('');

  const [xsmbData, setXsmbData] = useState<LotteryIndexData | null>(null);
  const [vietlott655Data, setVietlott655Data] = useState<LotteryIndexData | null>(null);
  const [vietlott645Data, setVietlott645Data] = useState<LotteryIndexData | null>(null);
  const [mlData, setMlData] = useState<MLInsightsData | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [bacNhoData, setBacNhoData] = useState<BacNhoData | null>(null);
  const [fullDrawsData, setFullDrawsData] = useState<VietlottFullDrawsData | null>(null);
  const [cooccurrenceData, setCooccurrenceData] = useState<VietlottCooccurrenceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Phím tắt toàn cục: Ctrl+K / Cmd+K hoặc phím '/' để mở tra cứu tức thì
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }
      if (e.key === '/' && !isSearchOpen) {
        const target = e.target as HTMLElement;
        const tagName = target?.tagName?.toUpperCase();
        if (tagName !== 'INPUT' && tagName !== 'TEXTAREA' && !target?.isContentEditable) {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Tự động cuộn trang lên đầu mượt mà khi người dùng chuyển tab
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTab]);

  // Tải dữ liệu 2 giai đoạn: Tải summary.json trước (<10KB, <50ms) sau đó nạp các chỉ mục chuyên sâu
  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        // Giai đoạn 1: Nạp ngay summary.json để hiển thị tức thì kết quả mới nhất
        try {
          const resSummary = await fetch('./data/summary.json');
          if (resSummary.ok) {
            const sumJson = await resSummary.json();
            setSummaryData(sumJson);
            setLoading(false);
          }
        } catch (sumErr) {
          console.warn('Lỗi tải summary.json:', sumErr);
        }

        // Giai đoạn 2: Nạp các tệp chỉ mục và ma trận chuyên sâu ở background
        const [resXsmb, res655, res645, resMl, resBacNho, resFullDraws, resCooc] = await Promise.all([
          fetch('./data/xsmb_index.json'),
          fetch('./data/vietlott_655_index.json'),
          fetch('./data/vietlott_645_index.json'),
          fetch('./data/ml_insights.json'),
          fetch('./data/bac_nho.json'),
          fetch('./data/vietlott_full_draws.json'),
          fetch('./data/vietlott_cooccurrence.json'),
        ]);

        if (resXsmb.ok) setXsmbData(await resXsmb.json());
        if (res655.ok) setVietlott655Data(await res655.json());
        if (res645.ok) setVietlott645Data(await res645.json());
        if (resMl.ok) setMlData(await resMl.json());
        if (resBacNho.ok) setBacNhoData(await resBacNho.json());
        if (resFullDraws.ok) setFullDrawsData(await resFullDraws.json());
        if (resCooc.ok) setCooccurrenceData(await resCooc.json());
      } catch (err) {
        console.error('Lỗi tải dữ liệu chỉ mục chuyên sâu:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, []);

  const handleSelectNumber = (num: string) => {
    setSelectedSearchNumber(num);
    setIsSearchOpen(true);
  };

  const latestDate = xsmbData?.metadata?.latest_date;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSearch={() => {
          setSelectedSearchNumber('');
          setIsSearchOpen(true);
        }}
        onOpenLegal={() => setIsLegalModalOpen(true)}
        latestDate={latestDate}
      />

      {/* Main Content Area */}
      <main className="app-main-content" style={{ flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto', padding: '24px 20px' }}>
        {loading ? (
          <SkeletonLoader />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Quick Hero Banner */}
            <div className="glass-card" style={{
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.5))',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="lottery-ball ball-gold" style={{ width: 44, height: 44, fontSize: '1.2rem' }}>
                  <Database size={20} />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                    Nền Tảng Dữ Liệu & Phân Tích Xổ Số Việt Nam & Vietlott
                  </h1>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Tích hợp <strong>7,500+ kỳ quay XSMB (2005 - nay)</strong> và <strong>toàn bộ kỳ quay Vietlott Power 6/55, Mega 6/45</strong>.
                  </p>
                </div>
              </div>

              {/* Hành Động Nhanh Trên Hero Banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setSelectedSearchNumber('');
                    setIsSearchOpen(true);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Search size={15} />
                  <span>Tra Cứu 20 Năm</span>
                  <span className="hide-mobile" style={{ fontSize: '0.72rem', opacity: 0.8, padding: '1px 5px', background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}>Ctrl K</span>
                </button>

                <button
                  onClick={() => setCurrentTab('heatmap')}
                  className="hide-mobile"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Flame size={15} color="var(--accent-gold)" />
                  <span>Ma Trận Nhiệt</span>
                </button>

                <button
                  onClick={() => setIsLegalModalOpen(true)}
                  className="hide-mobile"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>Pháp Lý 18+</span>
                </button>
              </div>
            </div>

            {/* TAB 1: XSMB */}
            {currentTab === 'xsmb' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <Suspense fallback={<TabFallback />}>
                  <XSMBProductHub
                    xsmbData={xsmbData}
                    summaryData={summaryData}
                    onSelectNumber={handleSelectNumber}
                  />
                </Suspense>

                <UniversalQuickChecker
                  summaryData={summaryData}
                  onOpenDeepLookup={handleSelectNumber}
                />

                <LiveResultsBoard
                  gameType="xsmb"
                  drawData={xsmbData?.latest_draw}
                  onSelectNumber={handleSelectNumber}
                  latest3D={summaryData?.vietlott_3d_latest}
                  latestKeno={summaryData?.vietlott_keno_latest}
                />

                {/* Bento Grid Layout 2.0: Cầu Nóng, Cảnh Báo Lô Gan & Phân Tích Dữ Liệu */}
                <BentoInsightsGrid
                  xsmbData={xsmbData}
                  summaryData={summaryData}
                  mlData={mlData}
                  onSelectNumber={handleSelectNumber}
                  onViewAllGan={() => setCurrentTab('gan')}
                  onViewAllHeatmap={() => setCurrentTab('heatmap')}
                  onViewAI={() => setCurrentTab('ai')}
                />

                <Suspense fallback={<TabFallback />}>
                  <HeatmapMatrix
                    data={xsmbData}
                    onSelectNumber={handleSelectNumber}
                  />
                </Suspense>
              </div>
            )}

            {/* TAB 2: VIETLOTT POWER 6/55 */}
            {currentTab === 'vietlott_655' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <Suspense fallback={<TabFallback />}>
                  <VietlottProductHub
                    gameType="vietlott_655"
                    indexData={vietlott655Data}
                    historicalDraws={fullDrawsData?.vietlott_655 || []}
                    cooccurrence={cooccurrenceData?.vietlott_655}
                    summaryData={summaryData}
                    onSelectNumber={handleSelectNumber}
                  />
                </Suspense>

                <Suspense fallback={<TabFallback />}>
                  <GanRankingView
                    xsmbData={xsmbData}
                    vietlottData={vietlott655Data}
                    onSelectNumber={handleSelectNumber}
                  />
                </Suspense>
              </div>
            )}

            {/* TAB 3: VIETLOTT MEGA 6/45 */}
            {currentTab === 'vietlott_645' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <Suspense fallback={<TabFallback />}>
                  <VietlottProductHub
                    gameType="vietlott_645"
                    indexData={vietlott645Data}
                    historicalDraws={fullDrawsData?.vietlott_645 || []}
                    cooccurrence={cooccurrenceData?.vietlott_645}
                    summaryData={summaryData}
                    onSelectNumber={handleSelectNumber}
                  />
                </Suspense>

                <Suspense fallback={<TabFallback />}>
                  <GanRankingView
                    xsmbData={xsmbData}
                    vietlottData={vietlott645Data}
                    onSelectNumber={handleSelectNumber}
                  />
                </Suspense>
              </div>
            )}

            {/* TAB: VIETLOTT KENO & MAX 3D / 3D PRO */}
            {currentTab === 'keno_3d' && (
              <Suspense fallback={<TabFallback />}>
                <KenoAndMax3DView
                  latestKeno={summaryData?.vietlott_keno_latest}
                  latest3D={summaryData?.vietlott_3d_latest}
                  latest3DPro={summaryData?.vietlott_3d_pro_latest}
                  onSelectNumber={handleSelectNumber}
                />
              </Suspense>
            )}

            {/* TAB 4: MA TRẬN NHIỆT (HEATMAP) */}
            {currentTab === 'heatmap' && (
              <Suspense fallback={<TabFallback />}>
                <HeatmapMatrix
                  data={xsmbData}
                  onSelectNumber={handleSelectNumber}
                />
              </Suspense>
            )}

            {/* TAB 5: LÔ GAN & TẦN SUẤT */}
            {currentTab === 'gan' && (
              <Suspense fallback={<TabFallback />}>
                <GanRankingView
                  xsmbData={xsmbData}
                  vietlottData={vietlott655Data}
                  onSelectNumber={handleSelectNumber}
                />
              </Suspense>
            )}

            {/* TAB 6: BẠC NHỚ MA TRẬN 20 NĂM */}
            {currentTab === 'bacnho' && (
              <Suspense fallback={<TabFallback />}>
                <BacNhoHub
                  bacNhoData={bacNhoData}
                  onSelectNumber={handleSelectNumber}
                />
              </Suspense>
            )}

            {/* TAB 7: BỘ LỌC DÀN SỐ & SO VÉ */}
            {currentTab === 'filter' && (
              <Suspense fallback={<TabFallback />}>
                <SmartFilterAndChecker
                  xsmbData={xsmbData}
                  vietlott655Data={vietlott655Data}
                  vietlott645Data={vietlott645Data}
                  fullDrawsData={fullDrawsData}
                  cooccurrenceData={cooccurrenceData}
                  onSelectNumber={handleSelectNumber}
                  onSwitchToVietlottCombo={(_balls) => {
                    setCurrentTab('vietlott_combo');
                  }}
                />
              </Suspense>
            )}

            {/* TAB 8: AI & BACKTEST */}
            {currentTab === 'ai' && (
              <Suspense fallback={<TabFallback />}>
                <AIStrategyHub
                  mlData={mlData}
                  onSelectNumber={handleSelectNumber}
                />
              </Suspense>
            )}
          </div>
        )}
      </main>

      {/* Floating Quick Search Button (Ẩn trên mobile, mobile dùng nút giữa của Bottom Nav) */}
      <button
        onClick={() => {
          setSelectedSearchNumber('');
          setIsSearchOpen(true);
        }}
        className="hide-mobile"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 22px',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          border: 'none',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.95rem',
          cursor: 'pointer',
          boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4), 0 0 20px rgba(239, 68, 68, 0.3)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
      >
        <Search size={20} />
        <span>Tra Cứu Số Tức Thì</span>
        <kbd style={{
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 4,
          padding: '1px 6px',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          color: '#ffffff',
          marginLeft: 4,
        }}>
          Ctrl K
        </kbd>
      </button>

      {/* Modal Tra Cứu Số */}
      <InstantLookupModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        xsmbData={xsmbData}
        vietlott655Data={vietlott655Data}
        vietlott645Data={vietlott645Data}
        fullDrawsData={fullDrawsData}
        cooccurrenceData={cooccurrenceData}
        initialNumber={selectedSearchNumber}
      />

      {/* Modal Tuân Thủ Pháp Lý & 18+ */}
      <LegalComplianceModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* Footer Tuân Thủ Pháp Lý & Trách Nhiệm Xã Hội */}
      <footer style={{
        marginTop: 60,
        borderTop: '1px solid var(--border-subtle)',
        padding: '40px 20px 24px',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        background: 'rgba(5, 8, 15, 0.98)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 28,
          marginBottom: 32,
        }}>
          {/* Cột 1: Thông tin Dự án & Nghiên cứu Khoa học */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div className="lottery-ball ball-gold" style={{ width: 28, height: 28, fontSize: '0.8rem' }}>88</div>
              <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>Vietnam Lottery & Vietlott Hub</strong>
            </div>
            <p style={{ lineHeight: 1.6, color: 'var(--text-dim)', marginBottom: 12 }}>
              Nền tảng phân tích thống kê xác suất, chuỗi thời gian và trực quan hóa dữ liệu xổ số mở (XSMB, Vietlott Power 6/55, Mega 6/45). Dự án mã nguồn mở phi lợi nhuận phục vụ học thuật và nghiên cứu khoa học dữ liệu.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem' }}>
                Open Source (MIT)
              </span>
              <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem' }}>
                100% Client-Side Privacy
              </span>
            </div>
          </div>

          {/* Cột 2: Hành Lang Pháp Lý & Phân Định Lô Đề Bất Hợp Pháp */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Scale size={18} color="var(--accent-emerald)" />
              <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>Hành Lang Pháp Lý & Phân Định</strong>
            </div>
            <p style={{ lineHeight: 1.6, color: 'var(--text-dim)', marginBottom: 12 }}>
              Xổ số kiến thiết truyền thống và Vietlott là hoạt động hợp pháp do Nhà nước cấp phép (Nghị định 30/2007/NĐ-CP & QĐ 1108/QĐ-TTg). Nền tảng <strong>tuyệt đối phản đối và nghiêm cấm</strong> việc lợi dụng dữ liệu vào hành vi lô đề, cờ bạc bất hợp pháp (Điều 321, 322 BLHS & Nghị định 144/2021/NĐ-CP).
            </p>
            <button
              onClick={() => setIsLegalModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.22)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
              }}
            >
              <ShieldCheck size={14} />
              <span>Xem Toàn Văn Tuyên Bố Pháp Lý & Miễn Trừ</span>
            </button>
          </div>

          {/* Cột 3: Chơi Có Trách Nhiệm (18+) & Cảnh Báo Rủi Ro */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={18} color="var(--accent-gold)" />
              <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>Chơi Có Trách Nhiệm (18+)</strong>
            </div>
            <p style={{ lineHeight: 1.6, color: 'var(--text-dim)', marginBottom: 8 }}>
              Chỉ dành cho người từ đủ <strong>18 tuổi trở lên</strong>. Xổ số là trò chơi giải trí xác suất ngẫu nhiên, không phải là phương thức đầu tư, tích lũy tài sản hay kiếm sống.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.76rem', color: 'var(--text-dim)' }}>
              <li>• Giữ vững nguyên tắc chi tiêu giải trí, tuyệt đối không vay mượn.</li>
              <li>• Thuật toán thống kê chỉ phản ánh dữ liệu lịch sử, không đảm bảo tương lai.</li>
              <li>• Biết dừng lại đúng lúc để bảo vệ bản thân và gia đình.</li>
            </ul>
          </div>
        </div>

        {/* Thanh Bản Quyền & Trạng Thái Hệ Thống */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
        }}>
          <div>
            © 2026 <strong>Vietnam Lottery Analytics Hub</strong>. Mã nguồn mở phục vụ mục đích nghiên cứu & học tập xác suất thống kê.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              GitHub Actions Tự Động Hóa 24/7
            </span>
            <button
              onClick={() => setIsLegalModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-emerald)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Chính sách & Miễn trừ trách nhiệm (18+)
            </button>
            <a
              href="https://github.com/thieucong98/vietnam-lottery-hub/blob/main/LEGAL_DISCLAIMER.md"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--accent-emerald)', textDecoration: 'none' }}
            >
              LEGAL_DISCLAIMER.md ↗
            </a>
          </div>
        </div>
      </footer>

      {/* THANH ĐIỀU HƯỚNG DƯỚI ĐÁY CHO DI ĐỘNG (MOBILE BOTTOM NAVIGATION) */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSearch={() => {
          setSelectedSearchNumber('');
          setIsSearchOpen(true);
        }}
        onOpenLegal={() => setIsLegalModalOpen(true)}
      />
    </div>
  );
}
