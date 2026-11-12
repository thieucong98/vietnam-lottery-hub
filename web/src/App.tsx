import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AgeGate } from './components/AgeGate';
import { SettingsModal } from './components/SettingsModal';
import { InstallPrompt } from './components/InstallPrompt';
import { Button } from './ui';
import { HeroBanner } from './layout/HeroBanner';
import { AppFooter } from './layout/AppFooter';
import { TicketResultsBanner } from './features/tickets/TicketResultsBanner';
import { OverlayRoutes, PageRoutes } from './app/AppRoutes';
import { getBackgroundLocation, useAppNavigation } from './app/navigation';
import { isOverlayPath, TabId, tabFromPath } from './app/routes';
import { useSummary } from './pages/useSummary';
import styles from './layout/Layout.module.css';

export function App() {
  const location = useLocation();
  const nav = useAppNavigation();
  const pagePath = isOverlayPath(location.pathname)
    ? getBackgroundLocation(location)?.pathname ?? '/'
    : location.pathname;
  const currentTab = tabFromPath(pagePath);
  const summary = useSummary();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Phím tắt: Ctrl+K / Cmd+K bật/tắt tra cứu, phím '/' mở tra cứu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isSettingsOpen) return;
        if (nav.isOverlayOpen) nav.closeOverlay();
        else nav.openSearch();
        return;
      }
      if (e.key === '/' && !nav.isOverlayOpen) {
        const target = e.target as HTMLElement;
        const tagName = target?.tagName?.toUpperCase();
        if (tagName !== 'INPUT' && tagName !== 'TEXTAREA' && !target?.isContentEditable) {
          e.preventDefault();
          nav.openSearch();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nav, isSettingsOpen]);

  // Cuộn lên đầu khi đổi tab (không áp dụng khi đổi tab con, đổi ngày hay mở/đóng hộp thoại)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTab]);

  const setCurrentTab = (tab: string) => nav.goTab(tab as TabId);

  return (
    <div className={styles.app}>
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSearch={() => nav.openSearch()}
        onOpenLegal={nav.openLegal}
        onOpenSettings={() => setIsSettingsOpen(true)}
        latestDate={summary.data?.xsmb_latest?.date}
      />

      <main id="main-content" className={`app-main-content ${styles.main}`}>
        <TicketResultsBanner summary={summary.data} />
        <HeroBanner onOpenSearch={() => nav.openSearch()} onOpenHeatmap={() => nav.goTab('heatmap')} onOpenLegal={nav.openLegal} />
        <PageRoutes />
      </main>

      {/* Nút tra cứu nổi (ẩn trên mobile, mobile dùng nút giữa của thanh điều hướng dưới) */}
      <Button variant="gradient" pill className={`hide-mobile ${styles.fab}`} icon={<Search size={20} />} onClick={() => nav.openSearch()}>
        <span>Tra Cứu Số Tức Thì</span>
        <kbd className={styles.kbd}>Ctrl K</kbd>
      </Button>

      <OverlayRoutes />

      {/* Cổng xác nhận 18+ bắt buộc lần đầu (lưu localStorage) */}
      <AgeGate onOpenLegal={nav.openLegal} />

      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Gợi ý "Thêm vào màn hình chính" (PWA), tự ẩn khi đã cài hoặc đã bị từ chối */}
      <InstallPrompt />

      <AppFooter onOpenLegal={nav.openLegal} onOpenBudget={() => nav.goTool('budget')} />

      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSearch={() => nav.openSearch()}
        onOpenLegal={nav.openLegal}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </div>
  );
}
