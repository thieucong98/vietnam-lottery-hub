import React from 'react';
import { Copy, Sparkles, Layers, Award, AlertTriangle, Trophy, Dices, Flame } from 'lucide-react';
import { formatVND } from '../../utils/lotteryUtils';
import type { SmartFilterAndCheckerModel } from './useTicketFilter';
import { getVietlottTicketSpec } from './ticketSpec';
import type { VietlottTicketType } from './ticketSpec';

export const VietlottFilterPanel: React.FC<{ model: SmartFilterAndCheckerModel }> = ({ model }) => {
  const { onSwitchToVietlottCombo, vietlottProduct, setVietlottProduct, vTicketType, setVTicketType, vTicketCount, setVTicketCount, vSumRange, setVSumRange, vParityRatio, setVParityRatio, vLowHighRatio, setVLowHighRatio, vExcludeGanLimit, setVExcludeGanLimit, vSelectedPair, setVSelectedPair, generatedTickets, setGeneratedTickets, vGenerationEmpty, setVGenerationEmpty, vCopiedNotice, maxBall, midBall, coocPairs, currentTicketSpec, currentGaussRange, handleGenerateVietlottTickets, handleCopyAllVietlottTickets } = model;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header & Product Switch */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--accent-gold)" />
              BỘ TẠO VÉ VIETLOTT THEO PHÂN PHỐI TỔNG (GAUSS)
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Sinh vé ngẫu nhiên rồi lọc theo tổng, chẵn/lẻ và các cặp số từng đồng xuất hiện trong 1.400+ kỳ. Mọi bộ 6 số đều có cùng xác suất trúng Jackpot ({vietlottProduct === '655' ? '1/28.989.675' : '1/8.145.060'}); bộ lọc này không làm tăng xác suất trúng.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`tab-btn ${vietlottProduct === '655' ? 'active' : ''}`}
              onClick={() => {
                setVietlottProduct('655');
                setGeneratedTickets([]);
                setVSelectedPair(null);
                setVGenerationEmpty(false);
              }}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              Power 6/55
            </button>
            <button
              className={`tab-btn ${vietlottProduct === '645' ? 'active' : ''}`}
              onClick={() => {
                setVietlottProduct('645');
                setGeneratedTickets([]);
                setVSelectedPair(null);
                setVGenerationEmpty(false);
              }}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              Mega 6/45
            </button>
          </div>
        </div>

        {/* BỘ CHỌN LOẠI VÉ VIETLOTT & SỐ LƯỢNG VÉ */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Row 1: Danh sách loại vé */}
          <div>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: 'var(--accent-gold)',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Layers size={16} />
              <span>CHỌN LOẠI VÉ VIETLOTT:</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                (Hệ thống tự động tính toán tổ hợp & dự toán giá theo chuẩn Vietlott)
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(
                [
                  'single',
                  'bao5',
                  'bao7',
                  'bao8',
                  'bao9',
                  'bao10',
                  'bao11',
                  'bao12',
                  'bao13',
                  'bao14',
                  'bao15',
                  'bao18',
                ] as VietlottTicketType[]
              ).map((tType) => {
                const spec = getVietlottTicketSpec(vietlottProduct, tType);
                const isSelected = vTicketType === tType;
                return (
                  <button
                    key={tType}
                    onClick={() => {
                      setVTicketType(tType);
                      setGeneratedTickets([]);
                    }}
                    style={{
                      padding: '7px 13px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(239, 68, 68, 0.2))'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                      color: isSelected ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span>{spec.label}</span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: isSelected ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.08)',
                        color: isSelected ? 'var(--text-on-solid-gold)' : 'var(--text-dim)',
                        fontWeight: 700,
                      }}
                    >
                      {formatVND(spec.cost)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Chọn Số Lượng Vé & Thông Số Loại Vé */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              paddingTop: 10,
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Số lượng vé cần sinh:
              </span>
              {[1, 3, 5, 10].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setVTicketCount(cnt)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: vTicketCount === cnt ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                    color: vTicketCount === cnt ? 'var(--text-on-solid-gold)' : 'var(--text-main)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {cnt} Vé
                </button>
              ))}
            </div>

            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span>
                Quy mô:{' '}
                <strong style={{ color: 'var(--accent-cyan)' }}>{currentTicketSpec.subTickets} vé con 6 số</strong>
              </span>
              <span>•</span>
              <span>
                Tổng tiền mua {vTicketCount} vé:{' '}
                <strong style={{ color: 'var(--accent-emerald)' }}>
                  {formatVND(currentTicketSpec.cost * vTicketCount)}
                </strong>
              </span>
              <span>•</span>
              <span>
                Khoảng Gauss chuẩn:{' '}
                <strong style={{ color: 'var(--accent-gold)' }}>
                  [{currentGaussRange.min} - {currentGaussRange.max} điểm]
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Các Tiêu Chí Lọc Thông Minh */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {/* 1. Tổng điểm */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: 8 }}>
              1. KHOẢNG TỔNG {currentTicketSpec.size} BÓNG:
            </div>
            <select
              aria-label="Khoảng tổng điểm"
              value={vSumRange}
              onChange={(e) => setVSumRange(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 4,
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#ffffff',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
              }}
            >
              <option value="gauss">
                Chuẩn Gauss ({currentGaussRange.min} - {currentGaussRange.max} điểm) [Chiếm ~80%]
              </option>
              <option value="low">Tổng thấp (&lt; {currentGaussRange.min} điểm)</option>
              <option value="high">Tổng cao (&gt; {currentGaussRange.max} điểm)</option>
              <option value="all">Tất cả khoảng tổng</option>
            </select>
          </div>

          {/* 2. Tỷ lệ Chẵn / Lẻ */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 8 }}>
              2. TỶ LỆ CHẴN / LẺ:
            </div>
            <select
              aria-label="Tỷ lệ chẵn / lẻ"
              value={vParityRatio}
              onChange={(e) => setVParityRatio(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 4,
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#ffffff',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
              }}
            >
              <option value="balanced">
                {currentTicketSpec.size === 6
                  ? 'Cân bằng: 3 Chẵn - 3 Lẻ (Tần suất cao nhất 33%)'
                  : currentTicketSpec.size % 2 === 0
                  ? `Cân bằng: ${currentTicketSpec.size / 2} Chẵn - ${currentTicketSpec.size / 2} Lẻ`
                  : `Cân bằng: ${Math.ceil(currentTicketSpec.size / 2)} - ${Math.floor(currentTicketSpec.size / 2)} (Tỷ lệ cao nhất)`}
              </option>
              <option value="even_heavy">Thiên Chẵn (Đa số bóng chẵn)</option>
              <option value="odd_heavy">Thiên Lẻ (Đa số bóng lẻ)</option>
              <option value="all">Bất kỳ tỷ lệ nào</option>
            </select>
          </div>

          {/* 3. Tỷ lệ Nhỏ / Lớn */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 8 }}>
              3. TỶ LỆ NHỎ / LỚN:
            </div>
            <select
              aria-label="Tỷ lệ nhỏ / lớn"
              value={vLowHighRatio}
              onChange={(e) => setVLowHighRatio(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 4,
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#ffffff',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
              }}
            >
              <option value="balanced">
                {currentTicketSpec.size === 6
                  ? `3 Nhỏ (01-${midBall}) - 3 Lớn (${midBall + 1}-${maxBall})`
                  : currentTicketSpec.size % 2 === 0
                  ? `Cân bằng: ${currentTicketSpec.size / 2} Nhỏ - ${currentTicketSpec.size / 2} Lớn`
                  : `Cân bằng: ${Math.ceil(currentTicketSpec.size / 2)} - ${Math.floor(currentTicketSpec.size / 2)}`}
              </option>
              <option value="low_heavy">Thiên Nhỏ (Nhiều bóng 01-{midBall})</option>
              <option value="high_heavy">Thiên Lớn (Nhiều bóng {midBall + 1}-{maxBall})</option>
              <option value="all">Bất kỳ</option>
            </select>
          </div>

          {/* 4. Loại trừ số gan */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-red)', marginBottom: 8 }}>
              4. LOẠI TRỪ SỐ GAN:
            </div>
            <select
              aria-label="Loại trừ số gan"
              value={vExcludeGanLimit}
              onChange={(e) => setVExcludeGanLimit(parseInt(e.target.value, 10))}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 4,
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#ffffff',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
              }}
            >
              <option value={20}>Loại bỏ các bóng gan &gt; 20 kỳ</option>
              <option value={30}>Loại bỏ các bóng gan &gt; 30 kỳ</option>
              <option value={15}>Loại bỏ các bóng gan &gt; 15 kỳ (Nghiêm ngặt)</option>
              <option value={0}>Không loại trừ số gan</option>
            </select>
          </div>
        </div>

        {/* Ưu tiên Cặp số Hot (Co-occurrence) */}
        {coocPairs.length > 0 && (
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={15} color="var(--accent-gold)" />
              Ép Chọn Cặp Số Hot (Tùy chọn: Vé sinh ra sẽ bắt buộc chứa cặp này):
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => setVSelectedPair(null)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: vSelectedPair === null ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                  color: vSelectedPair === null ? 'var(--text-on-solid-gold)' : 'var(--text-main)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Ngẫu nhiên tự do
              </button>
              {coocPairs.slice(0, 6).map((p, idx) => {
                const isSelected = vSelectedPair && vSelectedPair[0] === p.numbers[0] && vSelectedPair[1] === p.numbers[1];
                return (
                  <button
                    key={idx}
                    onClick={() => setVSelectedPair(isSelected ? null : p.numbers)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.04)',
                      color: isSelected ? 'var(--text-on-solid-cyan)' : 'var(--text-main)',
                      border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    [ {p.numbers[0]} - {p.numbers[1]} ] ({p.hits} kỳ)
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Các Nút Bấm Tạo Vé */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => handleGenerateVietlottTickets()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 24px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000000',
              fontWeight: 800,
              fontSize: '0.92rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <Dices size={19} />
            <span>
              🎲 Tạo {vTicketCount} {currentTicketSpec.label} Chuẩn Bộ Lọc
            </span>
          </button>

          <button
            onClick={() => {
              setVTicketType('single');
              setVTicketCount(5);
              handleGenerateVietlottTickets(5, 'single');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            <span>5 Vé Đơn (6 Số)</span>
          </button>

          <button
            onClick={() => {
              setVTicketType('bao7');
              setVTicketCount(1);
              handleGenerateVietlottTickets(1, 'bao7');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid var(--accent-cyan)',
              color: 'var(--accent-cyan)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            <Award size={15} />
            <span>1 Vé Bao 7</span>
          </button>

          <button
            onClick={() => {
              setVTicketType('bao8');
              setVTicketCount(1);
              handleGenerateVietlottTickets(1, 'bao8');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid var(--accent-emerald)',
              color: 'var(--accent-emerald)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            <Trophy size={15} />
            <span>1 Vé Bao 8</span>
          </button>

          {generatedTickets.length > 0 && (
            <button
              onClick={handleCopyAllVietlottTickets}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-subtle)',
                color: vCopiedNotice ? 'var(--accent-emerald)' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              <Copy size={16} />
              <span>{vCopiedNotice ? 'Đã sao chép tất cả!' : 'Sao chép toàn bộ vé'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Thông Báo Không Tìm Thấy Vé Phù Hợp */}
      {vGenerationEmpty && (
        <div
          className="glass-card animate-fade-in"
          style={{
            padding: '18px 22px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <AlertTriangle size={22} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fca5a5', marginBottom: 6 }}>
              Không tìm thấy vé thỏa mãn đồng thời các điều kiện lọc (sau 4.000 lần thử ngẫu nhiên)
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              Các tiêu chí bạn đang chọn (Tổng Gauss, tỷ lệ Chẵn/Lẻ, Nhỏ/Lớn, Lọc số gan hoặc Cặp số bắt buộc) có thể quá hẹp hoặc xung đột với nhau.
            </p>
            <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--accent-gold)' }}>
              💡 <strong>Gợi ý:</strong> Hãy nới lỏng các bộ lọc (chọn phân bổ <em>Cân Bằng</em>, giữ <em>Chuẩn Gauss</em> hoặc bỏ cặp số bắt buộc) rồi bấm tạo lại.
            </div>
          </div>
        </div>
      )}

      {/* Danh Sách Vé Đã Sinh */}
      {generatedTickets.length > 0 && (
        <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
              CÁC VÉ VỪA SINH ({generatedTickets.length} Vé Thỏa Mãn Tất Cả Tiêu Chí)
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Bấm "Kiểm tra lịch sử" để đối soát từng vé với toàn bộ 1.400+ kỳ quay!
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {generatedTickets.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                      Vé #{t.id}
                    </span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--accent-gold)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          padding: '1px 6px',
                          borderRadius: 3,
                          fontWeight: 700,
                        }}
                      >
                        {t.ticketTypeLabel}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: 'var(--accent-cyan)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          padding: '1px 6px',
                          borderRadius: 3,
                          fontWeight: 700,
                        }}
                      >
                        {t.subTickets} vé con
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '1px 6px',
                          borderRadius: 3,
                          fontWeight: 700,
                        }}
                      >
                        {formatVND(t.cost)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {t.balls.map((b) => (
                      <div
                        key={b}
                        className="lottery-ball ball-gold"
                        style={{ width: 34, height: 34, fontSize: '0.88rem' }}
                      >
                        {b.toString().padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Tổng: <strong style={{ color: 'var(--text-main)' }}>{t.sum}</strong> | {t.evenCount}C -{' '}
                    {t.balls.length - t.evenCount}L | {t.lowCount}N - {t.balls.length - t.lowCount}L
                  </div>

                  <button
                    onClick={() => {
                      if (onSwitchToVietlottCombo) {
                        onSwitchToVietlottCombo(t.balls, vietlottProduct);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid var(--accent-gold)',
                      color: 'var(--accent-gold)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Trophy size={13} />
                    <span>Kiểm tra lịch sử</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(t.balls.map((b) => b.toString().padStart(2, '0')).join(', '));
                    }}
                    title="Sao chép vé này"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-dim)',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
