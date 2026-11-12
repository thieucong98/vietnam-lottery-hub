import React from 'react';
import { Trophy, Calendar, BarChart3 } from 'lucide-react';
import type { KenoAndMax3DViewModel } from './useKeno3D';
import { ChartNote } from '../../ui';

export const Max3DPanel: React.FC<{ model: KenoAndMax3DViewModel }> = ({ model }) => {
  const { subTab, current3DData, digitFrequency3D, maxDigitCount } = model;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Bảng Mở Thưởng Max 3D / Max 3D Pro */}
      <div className="glass-card animate-fade-in" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                {subTab === 'max3d' ? 'BẢNG MỞ THƯỞNG VIETLOTT MAX 3D' : 'BẢNG MỞ THƯỞNG VIETLOTT MAX 3D PRO'}
              </h3>
              <span className="badge badge-hot">KỲ #{current3DData?.id || '#00784'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <Calendar size={14} />
              <span>Ngày mở thưởng: <strong>{current3DData?.date || 'Gần nhất'}</strong></span>
              <span>•</span>
              <span>
                {subTab === 'max3d'
                  ? 'Quay thưởng Thứ 2, Thứ 4, Thứ 6 hàng tuần lúc 18h00'
                  : 'Quay thưởng Thứ 3, Thứ 5, Thứ 7 hàng tuần lúc 18h00'}
              </span>
            </div>
          </div>

          <span className="badge badge-normal" style={{ fontSize: '0.82rem' }}>
            Trúng 1 tỷ - 2 tỷ đồng / vé 10.000đ
          </span>
        </div>

        {/* Các Hạng Giải Thưởng Chuẩn Vietlott */}
        {current3DData?.result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 1. GIẢI ĐẶC BIỆT */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Trophy size={20} color="var(--accent-gold)" />
                  <strong style={{ fontSize: '1.15rem', color: 'var(--accent-gold)', letterSpacing: 0.5 }}>
                    GIẢI ĐẶC BIỆT
                  </strong>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {subTab === 'max3d' ? 'Trúng 2 bộ ba số (1 tỷ đồng/vé)' : 'Trúng 2 bộ ba số theo thứ tự (2 tỷ đồng/vé)'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {(current3DData.result['Giải Đặc biệt'] || []).map((set, idx) => (
                  <div
                    key={idx}
                    className="lottery-ball ball-gold"
                    style={{
                      width: 'auto',
                      minWidth: 90,
                      height: 52,
                      padding: '0 18px',
                      borderRadius: 26,
                      fontSize: '1.6rem',
                      fontWeight: 900,
                      boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                    }}
                  >
                    {set}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. GIẢI NHẤT */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <strong style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>
                  GIẢI NHẤT (4 BỘ BA SỐ)
                </strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Trúng bất kỳ 2 trong 4 bộ ba số
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {(current3DData.result['Giải Nhất'] || []).map((set, idx) => (
                  <div
                    key={idx}
                    className="lottery-ball ball-cyan"
                    style={{
                      width: 'auto',
                      minWidth: 76,
                      height: 46,
                      padding: '0 14px',
                      borderRadius: 23,
                      fontSize: '1.35rem',
                      fontWeight: 800,
                    }}
                  >
                    {set}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. GIẢI NHÌ */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <strong style={{ fontSize: '1rem', color: '#34d399' }}>
                  GIẢI NHÌ (6 BỘ BA SỐ)
                </strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Trúng bất kỳ 2 trong 6 bộ ba số
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {(current3DData.result['Giải Nhì'] || []).map((set, idx) => (
                  <div
                    key={idx}
                    className="lottery-ball ball-emerald"
                    style={{
                      width: 'auto',
                      minWidth: 70,
                      height: 42,
                      padding: '0 12px',
                      borderRadius: 21,
                      fontSize: '1.25rem',
                      fontWeight: 700,
                    }}
                  >
                    {set}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. GIẢI BA */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                  GIẢI BA (8 BỘ BA SỐ)
                </strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Trúng bất kỳ 2 trong 8 bộ ba số
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(current3DData.result['Giải ba'] || []).map((set, idx) => (
                  <div
                    key={idx}
                    className="lottery-ball ball-slate"
                    style={{
                      width: 'auto',
                      minWidth: 64,
                      height: 40,
                      padding: '0 10px',
                      borderRadius: 20,
                      fontSize: '1.15rem',
                      fontWeight: 700,
                    }}
                  >
                    {set}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
            Đang cập nhật dữ liệu bảng giải Max 3D...
          </div>
        )}
      </div>

      {/* Biểu đồ phân bổ chữ số 0 - 9 trong kỳ mở thưởng Max 3D */}
      <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color="var(--accent-cyan)" />
            PHÂN BỔ TẦN SUẤT CHỮ SỐ (0 - 9) TRONG KỲ NÀY
          </h4>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Tổng cộng {digitFrequency3D.reduce((a, b) => a + b, 0)} lượt xuất hiện chữ số
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 10 }}>
          {digitFrequency3D.map((count, digit) => {
            const pct = (count / maxDigitCount) * 100;
            return (
              <div
                key={digit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '12px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: '0.78rem', color: count > 0 ? 'var(--accent-gold)' : 'var(--text-dim)', fontWeight: 700 }}>
                  {count} lần
                </span>
                <div
                  style={{
                    width: 14,
                    height: 70,
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 7,
                    display: 'flex',
                    alignItems: 'flex-end',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${pct}%`,
                      background: count > 3 ? 'var(--accent-gold)' : count > 0 ? 'var(--accent-cyan)' : 'transparent',
                      borderRadius: 7,
                      transition: 'height 0.4s ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                  {digit}
                </span>
              </div>
            );
          })}
        </div>
        <ChartNote
          sample={`1 kỳ mới nhất, ${digitFrequency3D.reduce((a, b) => a + b, 0)} lượt chữ số`}
          warning="Một kỳ là mẫu rất nhỏ, chênh lệch giữa các chữ số ở đây gần như hoàn toàn do ngẫu nhiên. Biểu đồ không cho biết trước kết quả kỳ sau và không làm tăng xác suất trúng."
        />
      </div>
    </div>
  );
};
