import { useCallback, useEffect, useState } from 'react';

/**
 * Theme sáng/tối và cỡ chữ. Lưu lựa chọn trên máy (localStorage), không gửi đi đâu.
 * `index.html` có script nhỏ đặt data-theme/data-font-scale lên <html> trước khi
 * React vẽ lần đầu (tránh hiện sai theme trong một khoảnh khắc lúc tải trang).
 */

export type ThemeMode = 'system' | 'light' | 'dark';
export type FontScale = 'sm' | 'md' | 'lg' | 'xl';

export const THEME_STORAGE_KEY = 'vlh_theme_v1';
export const FONT_SCALE_STORAGE_KEY = 'vlh_font_scale_v1';

export const FONT_SCALE_LABELS: Record<FontScale, string> = {
  sm: 'Nhỏ',
  md: 'Vừa',
  lg: 'Lớn',
  xl: 'Rất lớn',
};
export const FONT_SCALE_ORDER: FontScale[] = ['sm', 'md', 'lg', 'xl'];

function isThemeMode(v: string | null): v is ThemeMode {
  return v === 'system' || v === 'light' || v === 'dark';
}
function isFontScale(v: string | null): v is FontScale {
  return v === 'sm' || v === 'md' || v === 'lg' || v === 'xl';
}

export function getStoredTheme(): ThemeMode {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

export function getStoredFontScale(): FontScale {
  try {
    const v = window.localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    return isFontScale(v) ? v : 'md';
  } catch {
    return 'md';
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveThemeAttr(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode;
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', resolveThemeAttr(mode));
}

export function applyFontScale(scale: FontScale) {
  document.documentElement.setAttribute('data-font-scale', scale);
}

/** Theme hiện tại + hàm đổi, tự đồng bộ khi hệ thống đổi sáng/tối lúc đang ở chế độ "Hệ thống" */
export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(getStoredTheme);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage bị chặn: theme vẫn đổi trong phiên này, không lưu lại lần sau
    }
  }, []);

  return [mode, setMode] as const;
}

export function useFontScale() {
  const [scale, setScaleState] = useState<FontScale>(getStoredFontScale);

  useEffect(() => {
    applyFontScale(scale);
  }, [scale]);

  const setScale = useCallback((next: FontScale) => {
    setScaleState(next);
    try {
      window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, next);
    } catch {
      // localStorage bị chặn: cỡ chữ vẫn đổi trong phiên này
    }
  }, []);

  return [scale, setScale] as const;
}
