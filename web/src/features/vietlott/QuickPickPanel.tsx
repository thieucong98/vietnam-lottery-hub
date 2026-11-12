import React from 'react';
import { Sparkles, Dice5, Copy, Check, RefreshCw, Lock, Unlock, Layers } from 'lucide-react';
import type { VietlottProductHubModel } from './useVietlottHub';
import type { GeneratorMode } from './useVietlottHub';

export const QuickPickPanel: React.FC<{ model: VietlottProductHubModel }> = ({ model }) => {
  const { generatorMode, setGeneratorMode, pinnedNumbers, generatedNumbers, isRolling, quickPickCopied, is655, gameName, handleGenerateNumbers, handleTogglePin, handleCopyQuickPick, handleTransferToComboBao } = model;
  return (
    <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} color="var(--accent-gold)" />
            <span>Trình Tạo Bộ Số Ngẫu Nhiên Thông Minh ({gameName})</span>
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Chọn tiêu chuẩn phân phối toán học hoặc ghim những con số may mắn của riêng bạn.
          </p>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Mọi chế độ chọn số đều <strong>không làm tăng xác suất trúng</strong>. Xác suất trúng Jackpot{is655 ? ' 1' : ''} của mọi bộ 6 số: <strong>{is655 ? '1/28.989.675' : '1/8.145.060'}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'balanced', label: '⚖️ Cân Bằng Chẵn Lẻ (3C - 3L)' },
            { id: 'golden_sum', label: '🎯 Tổng Điểm Trung Bình' },
            { id: 'hot_bias', label: '🔥 Ưu Tiên Số Nóng (Hot)' },
            { id: 'random', label: '🎲 Thuần Ngẫu Nhiên' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setGeneratorMode(m.id as GeneratorMode)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: generatorMode === m.id ? 'var(--accent-gold)' : 'var(--border-subtle)',
                background: generatorMode === m.id ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: generatorMode === m.id ? 'var(--accent-gold)' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: '24px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          minHeight: 160,
        }}
      >
        {generatedNumbers.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
            <Dice5 size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p>Nhấn nút "Tạo Bộ Số Ngẫu Nhiên" bên dưới để sinh một bộ số.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            {generatedNumbers.map((num, idx) => {
              const isPinned = pinnedNumbers.includes(num);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div
                    className="lottery-ball ball-gold"
                    style={{
                      width: 58,
                      height: 58,
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      border: isPinned ? '2px solid #10b981' : undefined,
                      boxShadow: isPinned ? '0 0 12px rgba(16, 185, 129, 0.6)' : undefined,
                      animation: isRolling ? 'pulse-ring 0.4s infinite' : undefined,
                    }}
                    onClick={() => handleTogglePin(num)}
                    title={isPinned ? 'Số đã ghim (bấm để bỏ ghim)' : 'Bấm để ghim số này'}
                  >
                    {num.toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => handleTogglePin(num)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isPinned ? '#10b981' : 'var(--text-dim)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                    }}
                  >
                    {isPinned ? <Lock size={11} /> : <Unlock size={11} />}
                    <span>{isPinned ? 'Đã ghim' : 'Ghim'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {generatedNumbers.length === 6 && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>
              Tổng điểm: <strong style={{ color: '#ffffff' }}>{generatedNumbers.reduce((a, b) => a + b, 0)}</strong>
            </span>
            <span>•</span>
            <span>
              Chẵn/Lẻ:{' '}
              <strong style={{ color: '#ffffff' }}>
                {generatedNumbers.filter((n) => n % 2 === 0).length} Chẵn -{' '}
                {generatedNumbers.filter((n) => n % 2 !== 0).length} Lẻ
              </strong>
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={handleGenerateNumbers}
            disabled={isRolling}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: isRolling ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
            }}
          >
            <RefreshCw size={17} style={{ animation: isRolling ? 'spin 0.6s linear infinite' : undefined }} />
            <span>{generatedNumbers.length === 0 ? 'Tạo Bộ Số Ngẫu Nhiên' : 'Tạo Lại Bộ Khác'}</span>
          </button>

          {generatedNumbers.length === 6 && (
            <>
              <button
                onClick={handleCopyQuickPick}
                style={{
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {quickPickCopied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
                <span>{quickPickCopied ? 'Đã sao chép!' : 'Sao chép'}</span>
              </button>

              <button
                onClick={() => handleTransferToComboBao(generatedNumbers)}
                style={{
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Layers size={16} />
                <span>Nạp Sang Phân Tích Vé Bao</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
