import React from 'react';
import { Database, Flame, Search, ShieldCheck } from 'lucide-react';
import { Ball, Button, Card } from '../ui';
import styles from './Layout.module.css';

interface HeroBannerProps {
  onOpenSearch: () => void;
  onOpenHeatmap: () => void;
  onOpenLegal: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onOpenSearch, onOpenHeatmap, onOpenLegal }) => (
  <Card padding="none" className={styles.hero}>
    <div className={styles.heroTitleRow}>
      <Ball value="" size="md" tone="gold">
        <Database size={20} />
      </Ball>
      <div>
        <h1 className={styles.heroTitle}>Nền Tảng Dữ Liệu & Phân Tích Xổ Số Việt Nam & Vietlott</h1>
        <p className={styles.heroText}>
          Tích hợp <strong>7,500+ kỳ quay XSMB (2005 - nay)</strong> và{' '}
          <strong>toàn bộ kỳ quay Vietlott Power 6/55, Mega 6/45</strong>.
        </p>
      </div>
    </div>

    <div className={styles.heroActions}>
      <Button variant="gradient" pill icon={<Search size={15} />} onClick={onOpenSearch}>
        <span>Tra Cứu 20 Năm</span>
        <span className={`hide-mobile ${styles.kbd}`}>Ctrl K</span>
      </Button>
      <Button className="hide-mobile" pill icon={<Flame size={15} color="var(--accent-gold)" />} onClick={onOpenHeatmap}>
        Ma Trận Nhiệt
      </Button>
      <Button className={`hide-mobile ${styles.legalButton}`} pill icon={<ShieldCheck size={14} />} onClick={onOpenLegal}>
        Pháp Lý 18+
      </Button>
    </div>
  </Card>
);
