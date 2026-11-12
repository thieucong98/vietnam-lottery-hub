import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { XSMBProductHubModel } from './useXsmbHub';

export const XsmbQuickCheckPanel: React.FC<{ model: XSMBProductHubModel }> = ({ model }) => {
  const { checkInput, setCheckInput, checkResult, handleCheck } = model;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Nhập 2 số (ví dụ: 68) hoặc số vé 5 chữ số..."
          value={checkInput}
          maxLength={6}
          onChange={(e) => setCheckInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCheck();
          }}
          style={{
            flex: 1,
            minWidth: 220,
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-subtle)',
            color: '#ffffff',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />

        <button
          onClick={handleCheck}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            border: 'none',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CheckCircle2 size={16} />
          <span>Dò Ngay</span>
        </button>
      </div>

      {/* Kết quả dò vé */}
      {checkResult && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            background:
              checkResult.hits > 0
                ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.2), rgba(15, 23, 42, 0.8))'
                : 'rgba(0, 0, 0, 0.3)',
            border:
              checkResult.hits > 0 ? '1px solid #10b981' : '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 700 }}>
                Số cần dò: <span style={{ color: 'var(--accent-gold)' }}>{checkResult.query}</span> (2 số đuôi: {checkResult.query.slice(-2)})
              </div>
              <div style={{ fontSize: '0.82rem', color: checkResult.hits > 0 ? '#34d399' : 'var(--text-muted)', marginTop: 2 }}>
                {checkResult.hits > 0
                  ? `Hai số cuối ${checkResult.query.slice(-2)} xuất hiện ${checkResult.hits} lần trong 27 giải của kỳ mới nhất (thống kê, không phải kết quả trúng thưởng của vé).`
                  : 'Hai số cuối này chưa xuất hiện trong 27 giải của kỳ mới nhất.'}
              </div>
            </div>

            {checkResult.isSpecial && (
              <span className="badge badge-hot" style={{ fontSize: '0.8rem' }}>
                Trùng 2 số cuối Giải Đặc Biệt
              </span>
            )}
          </div>

          {checkResult.prizes.length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Xuất hiện tại: {checkResult.prizes.join(' • ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
