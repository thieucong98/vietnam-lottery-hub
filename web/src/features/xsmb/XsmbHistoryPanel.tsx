import React from 'react';
import { Sparkles, Search, Trophy, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Eye, MapPin } from 'lucide-react';
import type { XSMBProductHubModel } from './useXsmbHub';
import type { HistoryTimeRange } from './useXsmbHub';

export const XsmbHistoryPanel: React.FC<{ model: XSMBProductHubModel }> = ({ model }) => {
  const { historicalDraws, onSelectNumber, onSelectHistoricalDraw, selectedDrawDate, historySearch, setHistorySearch, historyRange, setHistoryRange, historyPage, setHistoryPage, expandedDrawDate, setExpandedDrawDate, totalHistoryPages, paginatedHistory } = model;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Thanh công cụ tìm kiếm và bộ lọc nhanh */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 4,
        }}
      >
        {/* Quick range tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginRight: 4 }}>
            Khoảng thời gian:
          </span>
          {[
            { id: '7', label: '7 ngày' },
            { id: '30', label: '30 ngày' },
            { id: '90', label: '90 ngày' },
            { id: 'all', label: `Tất cả (${historicalDraws.length})` },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setHistoryRange(r.id as HistoryTimeRange);
                setHistoryPage(1);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: historyRange === r.id ? 'var(--accent-purple)' : 'rgba(255,255,255,0.08)',
                background: historyRange === r.id ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                color: historyRange === r.id ? '#c084fc' : 'var(--text-muted)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Ô tìm kiếm thông minh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              gap: 8,
            }}
          >
            <Search size={14} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Tìm theo ngày (2026-10-09) hoặc 2 số cuối Giải ĐB (53)..."
              value={historySearch}
              onChange={(e) => {
                setHistorySearch(e.target.value);
                setHistoryPage(1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                width: 250,
              }}
            />
            {historySearch && (
              <button
                onClick={() => {
                  setHistorySearch('');
                  setHistoryPage(1);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách thẻ kỳ quay */}
      {paginatedHistory.length === 0 ? (
        <div
          style={{
            padding: '30px 20px',
            textAlign: 'center',
            color: 'var(--text-dim)',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
          }}
        >
          Không tìm thấy kỳ mở thưởng nào khớp với từ khóa "{historySearch}".
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paginatedHistory.map((draw) => {
            const isExpanded = expandedDrawDate === draw.date;
            const isSelectedOnBoard = selectedDrawDate === draw.date;

            return (
              <div
                key={draw.date}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: isSelectedOnBoard
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(30, 41, 59, 0.8))'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isSelectedOnBoard
                    ? '1px solid rgba(139, 92, 246, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  padding: '14px 18px',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Hàng thông tin tổng quan của kỳ */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  {/* Cột ngày & đài */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {draw.date}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {draw.day_of_week}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} />
                        <span>Đài {draw.province}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cột giải Đặc Biệt & Giải Nhất */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đặc Biệt:</span>
                      <span
                        className="mono"
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 900,
                          color: '#ef4444',
                          letterSpacing: '0.08em',
                          cursor: 'pointer',
                        }}
                        onClick={() => onSelectNumber(draw.special_2d)}
                        title={`Bấm xem thống kê số ${draw.special_2d}`}
                      >
                        {draw.special.slice(0, 3)}
                        <span style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>
                          {draw.special_2d}
                        </span>
                      </span>
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: 'var(--accent-gold)',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                        }}
                      >
                        ĐB {draw.special_2d}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Giải Nhất:</span>
                      <span className="mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {draw.prize1}
                      </span>
                    </div>

                    {/* Thống kê câm */}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {draw.silent_heads && draw.silent_heads.length > 0 && (
                        <span style={{ color: '#fb7185', marginRight: 6 }}>
                          Đầu câm: {draw.silent_heads.join(', ')}
                        </span>
                      )}
                      {draw.silent_tails && draw.silent_tails.length > 0 && (
                        <span style={{ color: '#38bdf8' }}>
                          Đuôi câm: {draw.silent_tails.join(', ')}
                        </span>
                      )}
                      {(!draw.silent_heads || draw.silent_heads.length === 0) &&
                       (!draw.silent_tails || draw.silent_tails.length === 0) && (
                        <span>Đủ đầu đuôi</span>
                      )}
                    </div>
                  </div>

                  {/* Cột nút hành động */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {onSelectHistoricalDraw && (
                      <button
                        onClick={() => onSelectHistoricalDraw(draw)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          background: isSelectedOnBoard ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                          color: isSelectedOnBoard ? 'var(--text-main)' : 'var(--text-muted)',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                        title="Hiển thị kết quả ngày này lên Bảng Mở Thưởng chính"
                      >
                        <Eye size={13} color={isSelectedOnBoard ? '#c084fc' : 'var(--text-dim)'} />
                        <span>{isSelectedOnBoard ? 'Đang Xem' : 'Xem Bảng Chính'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedDrawDate(isExpanded ? null : draw.date)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid',
                        borderColor: isExpanded ? 'var(--accent-gold)' : 'var(--border-subtle)',
                        background: isExpanded ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: isExpanded ? 'var(--accent-gold)' : 'var(--text-muted)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span>{isExpanded ? 'Thu Gọn' : 'Bảng 27 Giải & Đầu Đuôi'}</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {/* Accordion chi tiết 27 giải và đầu đuôi */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: 16,
                    }}
                  >
                    {/* Bảng mini 27 giải */}
                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 12,
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Trophy size={14} />
                        <span>Bảng 27 Giải Thưởng Ngày {draw.date}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem' }}>
                        {/* ĐB */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 4 }}>
                          <span style={{ color: '#f87171', fontWeight: 700 }}>Đặc Biệt</span>
                          <span
                            className="mono"
                            style={{ color: '#ef4444', fontWeight: 900, cursor: 'pointer' }}
                            onClick={() => onSelectNumber(draw.special_2d)}
                          >
                            {draw.special}
                          </span>
                        </div>

                        {/* G1 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ color: 'var(--text-dim)' }}>Giải Nhất</span>
                          <span className="mono" style={{ color: 'var(--text-main)', fontWeight: 700 }}>{draw.prize1}</span>
                        </div>

                        {/* G2 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ color: 'var(--text-dim)' }}>Giải Nhì</span>
                          <span className="mono" style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                            {[draw.raw_prizes.prize2_1, draw.raw_prizes.prize2_2].map((v) => `${v}`.padStart(5, '0')).join(' - ')}
                          </span>
                        </div>

                        {/* G3 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ color: 'var(--text-dim)' }}>Giải Ba</span>
                          <span className="mono" style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.78rem' }}>
                            {[draw.raw_prizes.prize3_1, draw.raw_prizes.prize3_2, draw.raw_prizes.prize3_3, draw.raw_prizes.prize3_4, draw.raw_prizes.prize3_5, draw.raw_prizes.prize3_6].map((v) => `${v}`.padStart(5, '0')).join(' ')}
                          </span>
                        </div>

                        {/* G4 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ color: 'var(--text-dim)' }}>Giải Tư</span>
                          <span className="mono" style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                            {[draw.raw_prizes.prize4_1, draw.raw_prizes.prize4_2, draw.raw_prizes.prize4_3, draw.raw_prizes.prize4_4].map((v) => `${v}`.padStart(4, '0')).join(' - ')}
                          </span>
                        </div>

                        {/* G5 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ color: 'var(--text-dim)' }}>Giải Năm</span>
                          <span className="mono" style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.78rem' }}>
                            {[draw.raw_prizes.prize5_1, draw.raw_prizes.prize5_2, draw.raw_prizes.prize5_3, draw.raw_prizes.prize5_4, draw.raw_prizes.prize5_5, draw.raw_prizes.prize5_6].map((v) => `${v}`.padStart(4, '0')).join(' ')}
                          </span>
                        </div>

                        {/* G6 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ color: 'var(--text-dim)' }}>Giải Sáu</span>
                          <span className="mono" style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                            {[draw.raw_prizes.prize6_1, draw.raw_prizes.prize6_2, draw.raw_prizes.prize6_3].map((v) => `${v}`.padStart(3, '0')).join(' - ')}
                          </span>
                        </div>

                        {/* G7 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px' }}>
                          <span style={{ color: 'var(--text-dim)' }}>Giải Bảy</span>
                          <span className="mono" style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>
                            {[draw.raw_prizes.prize7_1, draw.raw_prizes.prize7_2, draw.raw_prizes.prize7_3, draw.raw_prizes.prize7_4].map((v) => `${v}`.padStart(2, '0')).join(' - ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bảng mini Đầu - Đuôi Loto */}
                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 12,
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={14} />
                        <span>Bảng Đầu - Đuôi Lô Tô</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {Object.entries(draw.heads || {}).map(([head, tails]) => (
                          <div
                            key={head}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '3px 6px',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                              fontSize: '0.8rem',
                            }}
                          >
                            <span
                              className="lottery-ball ball-slate"
                              style={{ width: 22, height: 22, fontSize: '0.75rem', marginRight: 10 }}
                            >
                              {head}
                            </span>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {tails.length === 0 ? (
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>(Câm)</span>
                              ) : (
                                tails.map((t, idx) => {
                                  const numStr = `${head}${t}`;
                                  return (
                                    <span
                                      key={idx}
                                      className="mono"
                                      style={{
                                        padding: '1px 5px',
                                        borderRadius: 3,
                                        background: 'rgba(255, 255, 255, 0.06)',
                                        color: 'var(--text-main)',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                      }}
                                      onClick={() => onSelectNumber(numStr)}
                                      title={`Bấm xem lịch sử số ${numStr}`}
                                    >
                                      {t}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Phân trang lịch sử */}
      {totalHistoryPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <button
            disabled={historyPage === 1}
            onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(255,255,255,0.05)',
              color: historyPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
              fontSize: '0.8rem',
              cursor: historyPage === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ChevronLeft size={14} />
            <span>Trang trước</span>
          </button>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Trang <strong style={{ color: 'var(--text-main)' }}>{historyPage}</strong> / {totalHistoryPages}
          </span>

          <button
            disabled={historyPage >= totalHistoryPages}
            onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(255,255,255,0.05)',
              color: historyPage >= totalHistoryPages ? 'var(--text-dim)' : 'var(--text-main)',
              fontSize: '0.8rem',
              cursor: historyPage >= totalHistoryPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>Trang sau</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
