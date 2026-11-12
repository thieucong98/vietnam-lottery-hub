import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

// Chỉ lưu trên máy người dùng (localStorage), không gửi đi đâu
export const AGE_GATE_STORAGE_KEY = 'vlh_age_confirmed_v1';

function readConfirmed(): boolean {
  try {
    return window.localStorage.getItem(AGE_GATE_STORAGE_KEY) === 'yes';
  } catch {
    return false;
  }
}

interface AgeGateProps {
  onOpenLegal: () => void;
}

// Cổng xác nhận 18+ bắt buộc ở lần truy cập đầu tiên
export const AgeGate: React.FC<AgeGateProps> = ({ onOpenLegal }) => {
  const [confirmed, setConfirmed] = useState<boolean>(readConfirmed);
  const [declined, setDeclined] = useState<boolean>(false);

  if (confirmed) return null;

  const handleConfirm = () => {
    try {
      window.localStorage.setItem(AGE_GATE_STORAGE_KEY, 'yes');
    } catch {
      // localStorage bị chặn: vẫn cho vào trong phiên này, lần sau hỏi lại
    }
    setConfirmed(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      style={{
        position: 'fixed',
        inset: 0,
        // Trên InstantLookupModal (100), dưới LegalComplianceModal (110) để đọc được tuyên bố pháp lý
        zIndex: 105,
        backgroundColor: 'rgba(3, 7, 18, 0.97)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 520,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          border: '1px solid rgba(16, 185, 129, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={28} color="var(--accent-emerald)" />
          <h2 id="age-gate-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
            Xác nhận độ tuổi (18+)
          </h2>
        </div>

        {declined ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Trang này chỉ dành cho người từ đủ 18 tuổi trở lên. Bạn có thể đóng trang này.
          </p>
        ) : (
          <>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p>Trang này cung cấp kết quả và thống kê mô tả dữ liệu lịch sử của xổ số hợp pháp (XSKT, Vietlott), chỉ dành cho người từ đủ <strong>18 tuổi</strong> trở lên.</p>
              <p>Không có công cụ nào trên trang làm tăng xác suất trúng. Trang không bán vé, không nhận tiền và không liên kết với đại lý.</p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1,
                  minHeight: 44,
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-emerald)',
                  border: 'none',
                  color: '#000000',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Tôi đã đủ 18 tuổi
              </button>
              <button
                onClick={() => setDeclined(true)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Tôi chưa đủ 18 tuổi
              </button>
            </div>

            <button
              onClick={onOpenLegal}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-emerald)',
                fontSize: '0.8rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                alignSelf: 'flex-start',
              }}
            >
              Đọc tuyên bố pháp lý & chơi có trách nhiệm
            </button>
          </>
        )}
      </div>
    </div>
  );
};
