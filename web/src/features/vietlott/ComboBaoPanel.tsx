import React from 'react';
import { Trophy, Sparkles, Copy, Check, RefreshCw, Award, DollarSign, Layers } from 'lucide-react';
import { getVietlottTicketExpectedValue } from '../../utils/lotteryUtils';
import type { VietlottProductHubModel } from './useVietlottHub';
import type { BacktestHorizon } from './useVietlottHub';

export const ComboBaoPanel: React.FC<{ model: VietlottProductHubModel }> = ({ model }) => {
  const { selectedBalls, setSelectedBalls, comboCopied, filterMinMatches, setFilterMinMatches, backtestHorizon, setBacktestHorizon, is655, maxNumber, sortedDraws, latestDraw, handleToggleComboBall, handleQuickPickCombo6, handleCopyComboBalls, matchAnalysis, filteredTimeline } = model;
  return (
    <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Header Module Vé Bao */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={20} color="var(--accent-emerald)" />
            <span>Tra Cứu Bộ Số & Vé Bao (Tổ Hợp 2 - {is655 ? '18' : '15'} Bóng)</span>
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Chọn từ <strong>2 đến 6 bóng</strong> (vé đơn) hoặc lên đến <strong>{is655 ? '18' : '15'} bóng</strong> (vé Bao). Hệ thống đối soát toàn bộ {sortedDraws.length} kỳ quay lịch sử để thống kê các cấp giải từng trùng khớp.
          </p>
        </div>

        {/* Thông tin loại vé */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-hot" style={{ fontSize: '0.82rem' }}>
            {selectedBalls.length < 6
              ? `Bộ ${selectedBalls.length} Số (Chưa đủ vé đơn)`
              : selectedBalls.length === 6
              ? 'Vé Đơn Tiêu Chuẩn (6 Bóng)'
              : `Vé Bao ${selectedBalls.length} (${selectedBalls.length} Bóng)`}
          </span>
        </div>
      </div>

      {/* Các bóng đang chọn & Thanh công cụ thao tác nhanh */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Bóng đã chọn ({selectedBalls.length}/{is655 ? '18' : '15'}):
          </span>
          {selectedBalls.length === 0 ? (
            <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem', fontStyle: 'italic' }}>
              Chưa chọn bóng nào. Bấm vào các quả bóng bên dưới để chọn.
            </span>
          ) : (
            selectedBalls.map((b) => (
              <span
                key={b}
                className="lottery-ball ball-gold"
                style={{ width: 42, height: 42, fontSize: '1.1rem', cursor: 'pointer' }}
                onClick={() => handleToggleComboBall(b)}
                title={`Bấm để bỏ số ${b}`}
              >
                {b.toString().padStart(2, '0')}
              </span>
            ))
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleQuickPickCombo6}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={14} />
            <span>Ngẫu Nhiên 6 Số</span>
          </button>

          {latestDraw && (
            <button
              onClick={() => setSelectedBalls([...latestDraw.balls].sort((a, b) => a - b))}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RefreshCw size={14} />
              <span>Kỳ Mới Nhất</span>
            </button>
          )}

          {selectedBalls.length > 0 && (
            <>
              <button
                onClick={handleCopyComboBalls}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: comboCopied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: comboCopied ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                  color: comboCopied ? 'var(--accent-emerald)' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {comboCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{comboCopied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>

              <button
                onClick={() => setSelectedBalls([])}
                style={{
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fb7185',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Xóa hết
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lưới chọn bóng số 01 - 55 / 01 - 45 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
          gap: 8,
          padding: 16,
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {Array.from({ length: maxNumber }, (_, i) => i + 1).map((num) => {
          const isSelected = selectedBalls.includes(num);
          return (
            <button
              key={num}
              onClick={() => handleToggleComboBall(num)}
              style={{
                height: 40,
                borderRadius: '50%',
                background: isSelected
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                color: isSelected ? '#ffffff' : 'var(--text-main)',
                fontWeight: 800,
                fontSize: '0.92rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 0 12px rgba(245, 158, 11, 0.5)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {num.toString().padStart(2, '0')}
            </button>
          );
        })}
      </div>

      {/* Thẻ Thống Kê Số Lần Trúng Giải Qua Lịch Sử */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {/* Jackpot 1 */}
        <div
          className="glass-card"
          style={{
            padding: 16,
            border: matchAnalysis.counts[6] > 0 ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
            background: matchAnalysis.counts[6] > 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-glass)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700 }}>
              {is655 ? 'JACKPOT 1 (6/6)' : 'JACKPOT (6/6)'}
            </span>
            <Trophy size={15} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#ef4444' }}>
            {matchAnalysis.counts[6]}{' '}
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
            {is655 ? 'Từ 30+ Tỷ VNĐ' : 'Từ 12+ Tỷ VNĐ'}
          </div>
        </div>

        {/* Jackpot 2 (Chỉ có ở 6/55) */}
        {is655 && (
          <div
            className="glass-card"
            style={{
              padding: 16,
              border: matchAnalysis.counts.jp2 > 0 ? '2px solid #f43f5e' : '1px solid var(--border-subtle)',
              background: matchAnalysis.counts.jp2 > 0 ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-glass)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700 }}>JACKPOT 2 (5+1)</span>
              <Award size={15} color="#f43f5e" />
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#f43f5e' }}>
              {matchAnalysis.counts.jp2}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
              Từ 3+ Tỷ VNĐ
            </div>
          </div>
        )}

        {/* Giải Nhất (5/6) */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700 }}>GIẢI NHẤT (5/6)</span>
            <span className="badge badge-normal" style={{ fontSize: '0.7rem' }}>
              {is655 ? '40tr' : '10tr'}
            </span>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
            {matchAnalysis.counts[5]}{' '}
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
            Trùng 5 bóng chính
          </div>
        </div>

        {/* Giải Nhì (4/6) */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700 }}>GIẢI NHÌ (4/6)</span>
            <span className="badge badge-normal" style={{ fontSize: '0.7rem' }}>
              {is655 ? '500k' : '300k'}
            </span>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--accent-emerald)' }}>
            {matchAnalysis.counts[4]}{' '}
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
            Trùng 4 bóng chính
          </div>
        </div>

        {/* Giải Ba (3/6) */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700 }}>GIẢI BA (3/6)</span>
            <span className="badge badge-normal" style={{ fontSize: '0.7rem' }}>
              {is655 ? '50k' : '30k'}
            </span>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
            {matchAnalysis.counts[3]}{' '}
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
            Trùng 3 bóng chính
          </div>
        </div>
      </div>

      {/* Mô Phỏng Chi Phí: tổng tiền vé, tổng giải nhận được, giá trị kỳ vọng mỗi vé */}
      {selectedBalls.length === 6 && (
        <div className="glass-card animate-fade-in" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="lottery-ball ball-emerald" style={{ width: 38, height: 38, fontSize: '1.1rem' }}>
                <DollarSign size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                  Mô Phỏng Chi Phí
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Nếu mua bộ 6 số này ở mọi kỳ trong quá khứ thì tốn bao nhiêu tiền vé và nhận lại bao nhiêu tiền giải.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', padding: 3, borderRadius: 'var(--radius-sm)' }}>
              {[
                { id: 'all', label: `Toàn bộ (${sortedDraws.length} kỳ)` },
                { id: '3y', label: '3 Năm' },
                { id: '1y', label: '1 Năm' },
                { id: '100', label: '100 Kỳ' },
              ].map((h) => (
                <button
                  key={h.id}
                  onClick={() => setBacktestHorizon(h.id as BacktestHorizon)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: backtestHorizon === h.id ? 'var(--accent-emerald)' : 'transparent',
                    color: backtestHorizon === h.id ? '#000000' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                  }}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const horizonCount =
              backtestHorizon === '100'
                ? Math.min(100, sortedDraws.length)
                : backtestHorizon === '1y'
                ? Math.min(156, sortedDraws.length)
                : backtestHorizon === '3y'
                ? Math.min(468, sortedDraws.length)
                : sortedDraws.length;

            const horizonSlice = sortedDraws.slice(0, horizonCount);
            const userSet = new Set(selectedBalls);
            const ev = getVietlottTicketExpectedValue(is655);
            const totalTicketCost = horizonCount * ev.ticketPrice;

            const p1Val = is655 ? 40_000_000 : 10_000_000;
            const p2Val = is655 ? 500_000 : 300_000;
            const p3Val = is655 ? 50_000 : 30_000;

            let prizeCount = 0;
            let totalPrize = 0;
            for (const d of horizonSlice) {
              const m = d.balls.filter((b) => userSet.has(b)).length;
              const sp = is655 && d.special ? userSet.has(d.special) : false;
              if (m === 6) {
                prizeCount++;
                totalPrize += is655 ? 30_000_000_000 : 12_000_000_000;
              } else if (is655 && m === 5 && sp) {
                prizeCount++;
                totalPrize += 3_000_000_000;
              } else if (m === 5) {
                prizeCount++;
                totalPrize += p1Val;
              } else if (m === 4) {
                prizeCount++;
                totalPrize += p2Val;
              } else if (m === 3) {
                prizeCount++;
                totalPrize += p3Val;
              }
            }

            const roundVND = (v: number) => Math.round(v).toLocaleString('vi-VN');

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
                    <div style={{ fontSize: '0.82rem', marginBottom: 8 }}>
                      <strong style={{ color: 'var(--accent-gold)' }}>BỘ SỐ ĐANG CHỌN ({horizonCount} KỲ)</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Tổng tiền vé:</span>
                        <strong>{roundVND(totalTicketCost)} đ</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Tổng giải nhận được:</span>
                        <strong>{roundVND(totalPrize)} đ</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Số kỳ có giải:</span>
                        <strong>{prizeCount} / {horizonCount} kỳ</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
                    <div style={{ fontSize: '0.82rem', marginBottom: 8 }}>
                      <strong style={{ color: 'var(--text-muted)' }}>GIÁ TRỊ KỲ VỌNG MỖI VÉ (LÝ THUYẾT)</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Giá 1 vé:</span>
                        <strong>{roundVND(ev.ticketPrice)} đ</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Tiền giải kỳ vọng / vé:</span>
                        <strong>{roundVND(ev.expectedPrize)} đ</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Giá trị kỳ vọng / vé:</span>
                        <strong style={{ color: '#fb7185' }}>{roundVND(ev.expectedValue)} đ</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Xác suất trúng Jackpot{is655 ? ' 1' : ''}:</span>
                        <strong>1/{ev.totalCombinations.toLocaleString('vi-VN')}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                  Giá trị kỳ vọng âm nghĩa là trung bình mỗi vé mất khoảng {roundVND(-ev.expectedValue)} đ. Tính theo cơ cấu giải với Jackpot ở mức khởi điểm, chưa trừ thuế và chưa tính chia giải. Kết quả quá khứ không ảnh hưởng tới kỳ sau; chọn bộ số nào cũng không làm tăng xác suất trúng.
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Dòng Thời Gian Các Kỳ Trúng Thưởng (Matched Timeline) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
            Danh Sách Kỳ Quay Từng Trúng Thưởng ({filteredTimeline.length} kỳ)
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[
              { val: 2, label: '≥ 2 bóng' },
              { val: 3, label: '≥ 3 bóng (Có giải)' },
              { val: 4, label: '≥ 4 bóng' },
              { val: 5, label: '≥ 5 bóng' },
            ].map((f) => (
              <button
                key={f.val}
                onClick={() => setFilterMinMatches(f.val)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: filterMinMatches === f.val ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                  border: filterMinMatches === f.val ? 'none' : '1px solid var(--border-subtle)',
                  color: filterMinMatches === f.val ? '#000000' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTimeline.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontSize: '0.84rem' }}>
            Không có kỳ quay nào trùng khớp từ {filterMinMatches} bóng trở lên với bộ số này.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
            {filteredTimeline.slice(0, 50).map((item, idx) => {
              const userSet = new Set(selectedBalls);
              const isJackpot = item.matchCount === 6 || (item.matchCount === 5 && item.hasSpecial);

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: isJackpot ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: isJackpot ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.05)',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ minWidth: 80 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
                        #{item.draw.id}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {item.draw.date}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {item.draw.balls.map((b) => {
                        const isHit = userSet.has(b);
                        return (
                          <span
                            key={b}
                            className={`lottery-ball ${isHit ? 'ball-gold' : 'ball-slate'}`}
                            style={{ width: 30, height: 30, fontSize: '0.8rem', fontWeight: isHit ? 800 : 500 }}
                          >
                            {b.toString().padStart(2, '0')}
                          </span>
                        );
                      })}
                      {is655 && item.draw.special && (
                        <span
                          className={`lottery-ball ${userSet.has(item.draw.special) ? 'ball-red' : 'ball-jackpot2'}`}
                          style={{ width: 30, height: 30, fontSize: '0.8rem' }}
                        >
                          {item.draw.special.toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Trùng <strong>{item.matchCount}</strong> bóng
                    </span>
                    {item.prizeTitle && (
                      <span className={`badge ${isJackpot ? 'badge-hot' : 'badge-normal'}`} style={{ fontSize: '0.75rem' }}>
                        {item.prizeTitle}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
