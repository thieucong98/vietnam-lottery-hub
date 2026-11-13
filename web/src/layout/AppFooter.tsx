import React from 'react';
import { AlertTriangle, Scale, ShieldCheck } from 'lucide-react';
import { Ball, Button } from '../ui';
import styles from './Layout.module.css';

export const AppFooter: React.FC<{ onOpenLegal: () => void; onOpenBudget?: () => void }> = ({ onOpenLegal, onOpenBudget }) => (
  <footer className={styles.footer}>
    <div className={styles.footerGrid}>
      {/* Thông tin dự án */}
      <div>
        <div className={styles.footerHeading}>
          <Ball value="88" tone="gold" className={styles.smallBall} />
          <strong>Vietnam Lottery & Vietlott Hub</strong>
        </div>
        <p className={styles.footerText}>
          Nền tảng phân tích thống kê xác suất, chuỗi thời gian và trực quan hóa dữ liệu xổ số mở (XSMB, Vietlott Power 6/55,
          Mega 6/45). Dự án mã nguồn mở phi lợi nhuận phục vụ học thuật và nghiên cứu khoa học dữ liệu.
        </p>
        <div className={styles.footerBadges}>
          <span className={`badge ${styles.badgeEmerald}`}>Open Source (MIT)</span>
          <span className={`badge ${styles.badgeCyan}`}>100% Client-Side Privacy</span>
        </div>
      </div>

      {/* Hành lang pháp lý */}
      <div>
        <div className={styles.footerHeading}>
          <Scale size={18} color="var(--accent-emerald)" />
          <strong>Hành Lang Pháp Lý & Phân Định</strong>
        </div>
        <p className={styles.footerText}>
          Xổ số kiến thiết truyền thống và Vietlott là hoạt động hợp pháp do Nhà nước cấp phép (Nghị định 30/2007/NĐ-CP & QĐ
          1108/QĐ-TTg). Nền tảng <strong>tuyệt đối phản đối và nghiêm cấm</strong> việc lợi dụng dữ liệu vào hành vi lô đề, cờ
          bạc bất hợp pháp (Điều 321, 322 BLHS & Nghị định 144/2021/NĐ-CP).
        </p>
        <Button variant="emerald" size="sm" icon={<ShieldCheck size={14} />} onClick={onOpenLegal}>
          Xem Toàn Văn Tuyên Bố Pháp Lý & Miễn Trừ
        </Button>
      </div>

      {/* Chơi có trách nhiệm */}
      <div>
        <div className={styles.footerHeading}>
          <AlertTriangle size={18} color="var(--accent-gold)" />
          <strong>Chơi Có Trách Nhiệm (18+)</strong>
        </div>
        <p className={styles.footerText}>
          Chỉ dành cho người từ đủ <strong>18 tuổi trở lên</strong>. Xổ số là trò chơi giải trí xác suất ngẫu nhiên, không phải
          là phương thức đầu tư, tích lũy tài sản hay kiếm sống.
        </p>
        <ul className={styles.footerList}>
          <li>• Giữ vững nguyên tắc chi tiêu giải trí, tuyệt đối không vay mượn.</li>
          <li>• Thuật toán thống kê chỉ phản ánh dữ liệu lịch sử, không đảm bảo tương lai.</li>
          <li>• Biết dừng lại đúng lúc để bảo vệ bản thân và gia đình.</li>
        </ul>
        {onOpenBudget && (
          <Button variant="gold" size="sm" icon={<AlertTriangle size={14} />} onClick={onOpenBudget}>
            Tự đặt ngân sách & nơi hỗ trợ
          </Button>
        )}
      </div>
    </div>

    <div className={styles.footerBar}>
      <div>
        © 2026 <strong>Vietnam Lottery Analytics Hub</strong>. Mã nguồn mở phục vụ mục đích nghiên cứu & học tập xác suất thống kê.
      </div>
      <div className={styles.footerLinks}>
        <span>
          <span className={styles.statusDot} />
          GitHub Actions Tự Động Hóa 24/7
        </span>
        <Button variant="link" className={styles.footerLink} onClick={onOpenLegal}>
          Chính sách & Miễn trừ trách nhiệm (18+)
        </Button>
        <a
          className={styles.footerLink}
          href="https://github.com/thieucong98/vietnam-lottery-hub/blob/main/LEGAL_DISCLAIMER.md"
          target="_blank"
          rel="noreferrer"
        >
          LEGAL_DISCLAIMER.md ↗
        </a>
        {/* Link mã nguồn: header ẩn nút GitHub trên mobile nên giữ một link ở chân trang */}
        <a
          className={styles.footerLink}
          href="https://github.com/thieucong98/vietnam-lottery-hub"
          target="_blank"
          rel="noreferrer"
        >
          Mã nguồn trên GitHub ↗
        </a>
      </div>
    </div>
  </footer>
);
