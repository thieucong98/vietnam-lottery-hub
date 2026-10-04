import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LiveResultsBoard } from './components/LiveResultsBoard';
import { InstantLookupModal } from './components/InstantLookupModal';
import { HeatmapMatrix } from './components/HeatmapMatrix';
import { GanRankingView } from './components/GanRankingView';
import { AIStrategyHub } from './components/AIStrategyHub';
import { BacNhoHub } from './components/BacNhoHub';
import { SmartFilterAndChecker } from './components/SmartFilterAndChecker';
import { VietlottCombinationHub } from './components/VietlottCombinationHub';
import {
  LotteryIndexData,
  MLInsightsData,
  SummaryData,
  BacNhoData,
  VietlottFullDrawsData,
  VietlottCooccurrenceData,
} from './types';
import { Search, Flame, BarChart3, Database, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('xsmb');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
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

  // Tải dữ liệu chỉ mục JSON khi khởi động ứng dụng
  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        // Tải song song tất cả các file chỉ mục và tóm tắt
        const [resXsmb, res655, res645, resMl, resSummary, resBacNho, resFullDraws, resCooc] = await Promise.all([
          fetch('./data/xsmb_index.json'),
          fetch('./data/vietlott_655_index.json'),
          fetch('./data/vietlott_645_index.json'),
          fetch('./data/ml_insights.json'),
          fetch('./data/summary.json'),
          fetch('./data/bac_nho.json'),
          fetch('./data/vietlott_full_draws.json'),
          fetch('./data/vietlott_cooccurrence.json'),
        ]);

        if (resXsmb.ok) setXsmbData(await resXsmb.json());
        if (res655.ok) setVietlott655Data(await res655.json());
        if (res645.ok) setVietlott645Data(await res645.json());
        if (resMl.ok) setMlData(await resMl.json());
        if (resSummary.ok) setSummaryData(await resSummary.json());
        if (resBacNho.ok) setBacNhoData(await resBacNho.json());
        if (resFullDraws.ok) setFullDrawsData(await resFullDraws.json());
        if (resCooc.ok) setCooccurrenceData(await resCooc.json());
      } catch (err) {
        console.error('Lỗi tải dữ liệu chỉ mục:', err);
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
        latestDate={latestDate}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto', padding: '24px 20px' }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 16,
          }}>
            <div className="lottery-ball ball-gold" style={{ width: 64, height: 64, fontSize: '1.6rem', animation: 'pulse-ring 1.5s infinite' }}>
              88
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>
              Đang tải chỉ mục dữ liệu 20 năm xổ số...
            </p>
          </div>
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

              {/* Nút hành động nhanh */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => {
                    setSelectedSearchNumber('68');
                    setIsSearchOpen(true);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid var(--accent-gold)',
                    color: 'var(--accent-gold)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Search size={15} />
                  <span>Tra Cứu Số 68 Ngay</span>
                </button>

                <button
                  onClick={() => setCurrentTab('heatmap')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Flame size={15} color="var(--accent-gold)" />
                  <span>Xem Ma Trận Nhiệt</span>
                </button>
              </div>
            </div>

            {/* TAB 1: XSMB */}
            {currentTab === 'xsmb' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <LiveResultsBoard
                  gameType="xsmb"
                  drawData={xsmbData?.latest_draw}
                  onSelectNumber={handleSelectNumber}
                  latest3D={summaryData?.vietlott_3d_latest}
                  latestKeno={summaryData?.vietlott_keno_latest}
                />

                <HeatmapMatrix
                  data={xsmbData}
                  onSelectNumber={handleSelectNumber}
                />
              </div>
            )}

            {/* TAB 2: VIETLOTT POWER 6/55 */}
            {currentTab === 'vietlott_655' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <LiveResultsBoard
                  gameType="vietlott_655"
                  drawData={vietlott655Data?.latest_draw}
                  onSelectNumber={handleSelectNumber}
                  latest3D={summaryData?.vietlott_3d_latest}
                  latestKeno={summaryData?.vietlott_keno_latest}
                />

                <GanRankingView
                  xsmbData={xsmbData}
                  vietlottData={vietlott655Data}
                  onSelectNumber={handleSelectNumber}
                />
              </div>
            )}

            {/* TAB 3: VIETLOTT MEGA 6/45 */}
            {currentTab === 'vietlott_645' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <LiveResultsBoard
                  gameType="vietlott_645"
                  drawData={vietlott645Data?.latest_draw}
                  onSelectNumber={handleSelectNumber}
                  latest3D={summaryData?.vietlott_3d_latest}
                  latestKeno={summaryData?.vietlott_keno_latest}
                />

                <GanRankingView
                  xsmbData={xsmbData}
                  vietlottData={vietlott645Data}
                  onSelectNumber={handleSelectNumber}
                />
              </div>
            )}

            {/* TAB: BỘ SỐ & VÉ BAO VIETLOTT */}
            {currentTab === 'vietlott_combo' && (
              <VietlottCombinationHub
                fullDrawsData={fullDrawsData}
                cooccurrenceData={cooccurrenceData}
                onSelectNumber={handleSelectNumber}
              />
            )}

            {/* TAB 4: MA TRẬN NHIỆT (HEATMAP) */}
            {currentTab === 'heatmap' && (
              <HeatmapMatrix
                data={xsmbData}
                onSelectNumber={handleSelectNumber}
              />
            )}

            {/* TAB 5: LÔ GAN & TẦN SUẤT */}
            {currentTab === 'gan' && (
              <GanRankingView
                xsmbData={xsmbData}
                vietlottData={vietlott655Data}
                onSelectNumber={handleSelectNumber}
              />
            )}

            {/* TAB 6: BẠC NHỚ MA TRẬN 20 NĂM */}
            {currentTab === 'bacnho' && (
              <BacNhoHub
                bacNhoData={bacNhoData}
                onSelectNumber={handleSelectNumber}
              />
            )}

            {/* TAB 7: BỘ LỌC DÀN SỐ & SO VÉ */}
            {currentTab === 'filter' && (
              <SmartFilterAndChecker
                xsmbData={xsmbData}
                onSelectNumber={handleSelectNumber}
              />
            )}

            {/* TAB 8: AI & BACKTEST */}
            {currentTab === 'ai' && (
              <AIStrategyHub
                mlData={mlData}
                onSelectNumber={handleSelectNumber}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Quick Search Button */}
      <button
        onClick={() => {
          setSelectedSearchNumber('');
          setIsSearchOpen(true);
        }}
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
        initialNumber={selectedSearchNumber}
      />

      {/* Footer */}
      <footer style={{
        marginTop: 60,
        borderTop: '1px solid var(--border-subtle)',
        padding: '24px 20px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-dim)',
        background: 'rgba(8, 12, 20, 0.95)',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>Vietnam Lottery & Vietlott Analytics Platform</strong> © 2026. Mã nguồn mở phục vụ mục đích nghiên cứu & học tập.
          </div>
          <div>
            Tự động cập nhật hàng ngày bằng GitHub Actions • Host 100% trên GitHub Pages
          </div>
        </div>
      </footer>
    </div>
  );
}
