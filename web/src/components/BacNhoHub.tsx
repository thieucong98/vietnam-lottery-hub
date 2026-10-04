import React, { useState, useMemo } from 'react';
import { BacNhoData, BacNhoItem } from '../types';
import { Sparkles, Brain, Flame, Calendar, Award, Copy, Check, Info, ArrowRight, ShieldCheck } from 'lucide-react';

interface BacNhoHubProps {
  bacNhoData: BacNhoData | null;
  onSelectNumber: (num: string) => void;
}

export const BacNhoHub: React.FC<BacNhoHubProps> = ({ bacNhoData, onSelectNumber }) => {
  const [mode, setMode] = useState<'special' | 'loto'>('special');
  const [copied, setCopied] = useState(false);

  // Mặc định chọn 2 số cuối giải ĐB mới nhất nếu có, hoặc số 51
  const defaultNum = bacNhoData?.metadata?.latest_special_2d || '51';
  const [selectedNum, setSelectedNum] = useState<string>(defaultNum);

  // Đồng bộ khi dữ liệu tải xong
  React.useEffect(() => {
    if (bacNhoData?.metadata?.latest_special_2d) {
      setSelectedNum(bacNhoData.metadata.latest_special_2d);
    }
  }, [bacNhoData?.metadata?.latest_special_2d]);

  const currentItem: BacNhoItem | undefined = useMemo(() => {
    if (!bacNhoData) return undefined;
    const formatted = selectedNum.padStart(2, '0');
    if (mode === 'special') {
      return bacNhoData.by_special?.[formatted];
    } else {
      return bacNhoData.by_loto?.[formatted];
    }
  }, [bacNhoData, mode, selectedNum]);

  if (!bacNhoData) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
        Đang tải ma trận Bạc Nhớ 20 năm dữ liệu...
      </div>
    );
  }

  const followers = currentItem?.top_followers || [];
  const topNumbersStr = followers.slice(0, 10).map((f) => f.number).join(', ');

  const handleCopyTop = () => {
    navigator.clipboard.writeText(topNumbersStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div className="glass-card animate-fade-in" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="lottery-ball ball-purple" style={{ width: 48, height: 48, fontSize: '1.3rem' }}>
              <Brain size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                  BẠC NHỚ MA TRẬN 20 NĂM (DATA-DRIVEN BAC NHO)
                </h2>
                <span className="badge badge-hot">7,500+ KỲ QUAY</span>
                <span className="badge badge-normal" style={{ color: 'var(--accent-cyan)' }}>
                  XÁC SUẤT CÓ ĐIỀU KIỆN
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Khác biệt với bạc nhớ truyền miệng, hệ thống quét chính xác toàn bộ 20 năm lịch sử (2005 - {bacNhoData.metadata.latest_date.slice(0, 4)}) 
                để chứng minh khoa học: <em>Khi hôm trước về số X thì ngày mai số nào có tỷ lệ xuất hiện cao nhất</em>.
              </p>
            </div>
          </div>

          {/* Nút sao chép dàn gợi ý */}
          {followers.length > 0 && (
            <button
              onClick={handleCopyTop}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 'var(--radius-sm)',
                background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                border: copied ? '1px solid var(--accent-emerald)' : '1px solid #a855f7',
                color: copied ? 'var(--accent-emerald)' : '#d8b4fe',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Đã sao chép Top 10 số' : 'Sao chép Top 10 Bạc Nhớ'}</span>
            </button>
          )}
        </div>

        {/* Chế độ chọn Bạc Nhớ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setMode('special')}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: mode === 'special' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'transparent',
                color: mode === 'special' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              ⭐ Bạc Nhớ Theo Đề (Giải Đặc Biệt)
            </button>
            <button
              onClick={() => setMode('loto')}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: mode === 'loto' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'transparent',
                color: mode === 'loto' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              🎯 Bạc Nhớ Theo Lô Tô
            </button>
          </div>

          {/* Ô nhập số kiểm tra */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              {mode === 'special' ? 'Hôm trước Đề về:' : 'Hôm trước có Lô:'}
            </span>
            <input
              type="text"
              maxLength={2}
              value={selectedNum}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setSelectedNum(val);
              }}
              style={{
                width: 60,
                textAlign: 'center',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid var(--accent-gold)',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                fontSize: '1.1rem',
                fontWeight: 800,
              }}
            />
            {bacNhoData.metadata.latest_special_2d && (
              <button
                onClick={() => setSelectedNum(bacNhoData.metadata.latest_special_2d)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                Gần nhất: {bacNhoData.metadata.latest_special_2d} ({bacNhoData.metadata.latest_date})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thông số Trigger & Kết Quả */}
      {currentItem ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Banner Tóm tắt */}
          <div className="glass-card" style={{
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
            borderLeft: '4px solid #a855f7',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="lottery-ball ball-gold" style={{ width: 50, height: 50, fontSize: '1.4rem' }}>
                {selectedNum.padStart(2, '0')}
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                  {mode === 'special' ? `Khi Giải ĐB về ${selectedNum.padStart(2, '0')}` : `Khi Lô ${selectedNum.padStart(2, '0')} xuất hiện`}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Đã xảy ra <strong>{currentItem.total_triggers} lần</strong> trong 7,500+ kỳ quay XSMB 20 năm qua. Dưới đây là các con số ngày hôm sau hay xuất hiện nhất:
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <span className="badge badge-normal" style={{ fontSize: '0.82rem' }}>
                Tần suất mẫu: {currentItem.total_triggers} kỳ
              </span>
            </div>
          </div>

          {/* Grid Top 10 Followers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {followers.map((item, idx) => {
              const isTop3 = idx < 3;
              const isGanRisk = item.days_since_last > 10;
              const isHotCycle = item.days_since_last <= 2;

              return (
                <div
                  key={item.number}
                  className="glass-card hover-glow"
                  onClick={() => onSelectNumber(item.number)}
                  style={{
                    padding: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    border: isTop3 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
                    background: isTop3 ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(15, 23, 42, 0.6))' : 'var(--bg-glass)',
                  }}
                  title="Bấm để xem lịch sử 20 năm chi tiết của số này"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isTop3 ? 'var(--accent-gold)' : 'var(--text-dim)', width: 20 }}>
                        #{idx + 1}
                      </span>
                      <div className={`lottery-ball ${isTop3 ? 'ball-gold' : 'ball-slate'}`} style={{ width: 44, height: 44, fontSize: '1.25rem' }}>
                        {item.number}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isTop3 ? 'var(--accent-gold)' : '#ffffff', fontFamily: 'var(--font-mono)' }}>
                        {item.rate}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {item.hits} / {currentItem.total_triggers} lần
                      </div>
                    </div>
                  </div>

                  {/* Thanh tiến trình tỉ lệ */}
                  <div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, item.rate * 2.5)}%`,
                        height: '100%',
                        background: isTop3 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'var(--accent-cyan)',
                        borderRadius: 3,
                      }} />
                    </div>
                  </div>

                  {/* Footer card: trạng thái gan và nhịp */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>
                      Gan hiện tại: <strong style={{ color: isGanRisk ? 'var(--accent-rose)' : 'var(--text-main)' }}>{item.days_since_last} ngày</strong>
                    </span>
                    {isHotCycle ? (
                      <span className="badge badge-hot" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        Đang Nhịp
                      </span>
                    ) : isGanRisk ? (
                      <span className="badge badge-normal" style={{ fontSize: '0.68rem', color: '#fb7185', padding: '1px 6px' }}>
                        Cảnh Báo Gan
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>Khá đều</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Không tìm thấy dữ liệu mẫu cho số {selectedNum}. Vui lòng nhập số từ 00 đến 99.
        </div>
      )}
    </div>
  );
};
