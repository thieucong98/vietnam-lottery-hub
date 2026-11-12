import React from 'react';
import { Laptop2, Moon, Sun, Type } from 'lucide-react';
import { Button, Modal } from '../ui';
import { FONT_SCALE_LABELS, FONT_SCALE_ORDER, ThemeMode, useFontScale, useTheme } from '../app/theme';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { id: 'system', label: 'Hệ thống', icon: <Laptop2 size={16} /> },
  { id: 'light', label: 'Sáng', icon: <Sun size={16} /> },
  { id: 'dark', label: 'Tối', icon: <Moon size={16} /> },
];

/** Cài đặt hiển thị: theme sáng/tối và cỡ chữ. Chỉ lưu trên máy (localStorage). */
export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const [themeMode, setThemeMode] = useTheme();
  const [fontScale, setFontScale] = useFontScale();

  return (
    <Modal open={open} onClose={onClose} title="Giao Diện & Hiển Thị" icon={<Type size={20} color="var(--accent-emerald)" />} size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Giao diện màu</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="radiogroup" aria-label="Chọn giao diện màu">
            {THEME_OPTIONS.map((opt) => (
              <Button
                key={opt.id}
                variant={themeMode === opt.id ? 'emerald' : 'secondary'}
                style={{ flex: 1, minWidth: 80, minHeight: 44 }}
                icon={opt.icon}
                role="radio"
                aria-checked={themeMode === opt.id}
                onClick={() => setThemeMode(opt.id)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Cỡ chữ</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="radiogroup" aria-label="Chọn cỡ chữ">
            {FONT_SCALE_ORDER.map((scale) => (
              <Button
                key={scale}
                variant={fontScale === scale ? 'emerald' : 'secondary'}
                style={{ flex: 1, minWidth: 80, minHeight: 44 }}
                role="radio"
                aria-checked={fontScale === scale}
                onClick={() => setFontScale(scale)}
              >
                {FONT_SCALE_LABELS[scale]}
              </Button>
            ))}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            Phù hợp cho người lớn tuổi hoặc người khó đọc chữ nhỏ. Áp dụng cho toàn bộ trang.
          </p>
        </div>
      </div>
    </Modal>
  );
};
