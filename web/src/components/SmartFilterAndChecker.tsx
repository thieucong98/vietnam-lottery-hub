import React, { useState, useMemo } from 'react';
import { LotteryIndexData } from '../types';
import { CheckCircle2, Filter, Copy, Check, Sparkles, RefreshCw, Layers, Award, AlertCircle } from 'lucide-react';

interface SmartFilterAndCheckerProps {
  xsmbData: LotteryIndexData | null;
  onSelectNumber: (num: string) => void;
}

export const SmartFilterAndChecker: React.FC<SmartFilterAndCheckerProps> = ({ xsmbData, onSelectNumber }) => {
  const [activeSubTab, setActiveSubTab] = useState<'filter' | 'checker'>('filter');

  // State cho Bộ Lọc Dàn Số
  const [selectedChams, setSelectedChams] = useState<number[]>([]);
  const [selectedTongs, setSelectedTongs] = useState<number[]>([]);
  const [tongParity, setTongParity] = useState<'all' | 'even' | 'odd'>('all');
  const [tongSize, setTongSize] = useState<'all' | 'small' | 'large'>('all'); // small < 10, large >= 10
  const [includeKiepBang, setIncludeKiepBang] = useState<boolean>(true);
  const [excludeGanDays, setExcludeGanDays] = useState<number>(0); // 0: không loại, 10: loại gan > 10d, 15: loại gan > 15d
  const [filterCopied, setFilterCopied] = useState<boolean>(false);

  // State cho Trình So Vé
  const [ticketInput, setTicketInput] = useState<string>('03, 14, 28, 51, 68, 86, 89, 90');
  const [customSpecialInput, setCustomSpecialInput] = useState<string>('');

  // 1. Logic lọc dàn số
  const filteredNumbers: string[] = useMemo(() => {
    const list: string[] = [];

    for (let i = 0; i < 100; i++) {
      const str = i.toString().padStart(2, '0');
      const d1 = parseInt(str[0], 10);
      const d2 = parseInt(str[1], 10);
      const sum = (d1 + d2) % 10;
      const rawSum = d1 + d2;
      const isKiepBang = d1 === d2;

      // Lọc theo Chạm
      if (selectedChams.length > 0) {
        if (!selectedChams.includes(d1) && !selectedChams.includes(d2)) {
          continue;
        }
      }

      // Lọc theo Tổng cụ thể
      if (selectedTongs.length > 0) {
        if (!selectedTongs.includes(sum)) {
          continue;
        }
      }

      // Lọc theo Chẵn / Lẻ của Tổng
      if (tongParity === 'even' && sum % 2 !== 0) continue;
      if (tongParity === 'odd' && sum % 2 === 0) continue;

      // Lọc theo Tổng bé / lớn
      if (tongSize === 'small' && rawSum >= 10) continue;
      if (tongSize === 'large' && rawSum < 10) continue;

      // Lọc kép bằng
      if (!includeKiepBang && isKiepBang) continue;

      // Loại trừ Lô Gan
      if (excludeGanDays > 0 && xsmbData?.numbers) {
        const numDetail = xsmbData.numbers[str];
        if (numDetail && numDetail.days_since_last > excludeGanDays) {
          continue;
        }
      }

      list.push(str);
    }

    return list;
  }, [selectedChams, selectedTongs, tongParity, tongSize, includeKiepBang, excludeGanDays, xsmbData]);

  const handleCopyFiltered = () => {
    navigator.clipboard.writeText(filteredNumbers.join(', '));
    setFilterCopied(true);
    setTimeout(() => setFilterCopied(false), 2000);
  };

  const handleSendToChecker = () => {
    setTicketInput(filteredNumbers.join(', '));
    setActiveSubTab('checker');
  };

  const handleToggleCham = (c: number) => {
    setSelectedChams((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const handleToggleTong = (t: number) => {
    setSelectedTongs((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleResetFilter = () => {
    setSelectedChams([]);
    setSelectedTongs([]);
    setTongParity('all');
    setTongSize('all');
    setIncludeKiepBang(true);
    setExcludeGanDays(0);
  };

  // 2. Logic So Vé Hàng Loạt
  const parsedTickets = useMemo(() => {
    const rawTokens = ticketInput.split(/[\s,;|]+/);
    const valid = rawTokens
      .map((t) => t.trim().padStart(2, '0'))
      .filter((t) => t.length === 2 && !isNaN(Number(t)));
    return Array.from(new Set(valid));
  }, [ticketInput]);

  const latestXSMB = xsmbData?.latest_draw as any;
  const lotoResults: string[] = useMemo(() => {
    return latestXSMB?.loto_numbers || [];
  }, [latestXSMB]);

  const specialPrizeNumber = useMemo(() => {
    const p = latestXSMB?.raw_prizes?.special?.toString() || '';
    return p.length >= 2 ? p.slice(-2) : '';
  }, [latestXSMB]);

  // Phân tích kết quả so vé
  const checkerReport = useMemo(() => {
    let matchCount = 0;
    let totalHits = 0;
    let hitSpecial = false;

    const details = parsedTickets.map((num) => {
      const hits = lotoResults.filter((r) => r === num).length;
      const isSpecial = num === specialPrizeNumber;
      if (hits > 0) {
        matchCount++;
        totalHits += hits;
      }
      if (isSpecial) hitSpecial = true;
      return {
        number: num,
        hits,
        isSpecial,
        isWin: hits > 0,
      };
    });

    return {
      totalTickets: parsedTickets.length,
      matchCount,
      totalHits,
      hitSpecial,
      rate: parsedTickets.length > 0 ? Math.round((matchCount / parsedTickets.length) * 100) : 0,
      details,
    };
  }, [parsedTickets, lotoResults, specialPrizeNumber]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Navigation Switch Sub-tabs */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveSubTab('filter')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeSubTab === 'filter' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'transparent',
                color: activeSubTab === 'filter' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              <Filter size={16} />
              <span>Bộ Lọc Dàn Số Thông Minh</span>
            </button>
            <button
              onClick={() => setActiveSubTab('checker')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeSubTab === 'checker' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'transparent',
                color: activeSubTab === 'checker' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Trình So Vé Hàng Loạt</span>
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
          Kỳ quay đối soát: <strong>{latestXSMB?.date || 'Mới nhất'}</strong> (Đặc biệt: <strong style={{ color: 'var(--accent-rose)' }}>{specialPrizeNumber || '--'}</strong>)
        </div>
      </div>

      {/* 1. VIEW BỘ LỌC DÀN SỐ */}
      {activeSubTab === 'filter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Cụm điều khiển bộ lọc */}
          <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>CẤU HÌNH THÔNG SỐ LỌC DÀN</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Lọc chạm, tổng, loại trừ lô gan để tạo dàn số chuẩn xác cho đề hoặc lô tô.
                </p>
              </div>
              <button
                onClick={handleResetFilter}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-dim)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} />
                <span>Đặt lại mặc định</span>
              </button>
            </div>

            {/* Lọc Chạm 0 - 9 */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: 8 }}>
                1. LỌC THEO CHẠM (Chạm đầu hoặc đuôi):
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => {
                  const isSelected = selectedChams.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => handleToggleCham(c)}
                      style={{
                        width: 44,
                        height: 38,
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                        color: isSelected ? '#000000' : 'var(--text-main)',
                        border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lọc Tổng 0 - 9 */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 8 }}>
                2. LỌC THEO TỔNG (Tổng chữ số % 10):
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((t) => {
                  const isSelected = selectedTongs.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => handleToggleTong(t)}
                      style={{
                        width: 44,
                        height: 38,
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                        color: isSelected ? '#000000' : 'var(--text-main)',
                        border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      T{t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quy luật Tổng & Kép & Lô Gan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {/* Tổng Chẵn / Lẻ */}
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 6 }}>Tính chẵn/lẻ tổng:</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'even', label: 'Tổng Chẵn' },
                    { key: 'odd', label: 'Tổng Lẻ' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setTongParity(item.key as any)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: tongParity === item.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        color: tongParity === item.key ? '#ffffff' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tổng Lớn / Bé */}
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 6 }}>Độ lớn tổng:</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'small', label: 'Tổng < 10' },
                    { key: 'large', label: 'Tổng ≥ 10' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setTongSize(item.key as any)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: tongSize === item.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        color: tongSize === item.key ? '#ffffff' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loại bỏ Lô Gan */}
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 6 }}>Loại bỏ Lô Gan:</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { val: 0, label: 'Giữ tất cả' },
                    { val: 10, label: 'Loại gan > 10 ngày' },
                    { val: 15, label: 'Loại gan > 15 ngày' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => setExcludeGanDays(item.val)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: excludeGanDays === item.val ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.05)',
                        border: excludeGanDays === item.val ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
                        color: excludeGanDays === item.val ? '#fb7185' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Kết quả Dàn Lọc */}
          <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="badge badge-hot" style={{ fontSize: '0.9rem', padding: '4px 10px' }}>
                  DÀN {filteredNumbers.length} SỐ
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Thỏa mãn toàn bộ các điều kiện đã chọn ở trên
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleCopyFiltered}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: filterCopied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                    border: filterCopied ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-gold)',
                    color: filterCopied ? 'var(--accent-emerald)' : 'var(--accent-gold)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {filterCopied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{filterCopied ? 'Đã sao chép dàn' : 'Sao chép dàn số'}</span>
                </button>

                <button
                  onClick={handleSendToChecker}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>So vé dàn này ngay</span>
                </button>
              </div>
            </div>

            {/* Dãy các số trong dàn */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {filteredNumbers.map((num) => (
                <span
                  key={num}
                  className="lottery-ball ball-slate hover-glow"
                  onClick={() => onSelectNumber(num)}
                  style={{ width: 42, height: 42, fontSize: '1.05rem', cursor: 'pointer' }}
                  title={`Bấm để xem lịch sử số ${num}`}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. VIEW TRÌNH SO VÉ HÀNG LOẠT */}
      {activeSubTab === 'checker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Ô nhập dàn số */}
          <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>NHẬP HOẶC DÁN DÀN SỐ CẦN ĐỐI SOÁT</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Nhập các số 2 chữ số (ngăn cách bằng dấu phẩy, khoảng trắng hoặc xuống dòng). Hệ thống sẽ tự động đối soát với kết quả XSMB kỳ <strong>{latestXSMB?.date}</strong>.
            </p>
            <textarea
              rows={4}
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              placeholder="Ví dụ: 03, 14, 28, 51, 68, 86, 89"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                lineHeight: 1.5,
                resize: 'vertical',
              }}
            />
          </div>

          {/* Báo Cáo Kết Quả So Vé */}
          <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>KẾT QUẢ ĐỐI SOÁT KỲ {latestXSMB?.date}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Tổng số vé: <strong>{checkerReport.totalTickets}</strong> con
                  </span>
                  <span>•</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    Trúng: {checkerReport.matchCount} / {checkerReport.totalTickets} ({checkerReport.rate}%)
                  </span>
                  <span>•</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                    Tổng số nháy nổ: {checkerReport.totalHits} nháy
                  </span>
                </div>
              </div>

              {checkerReport.hitSpecial && (
                <div className="badge badge-hot" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                  🎉 CHÚC MỪNG: TRÚNG GIẢI ĐẶC BIỆT ({specialPrizeNumber})!
                </div>
              )}
            </div>

            {/* Chi tiết từng con số trong vé */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 12,
            }}>
              {checkerReport.details.map((item) => (
                <div
                  key={item.number}
                  className="glass-card"
                  onClick={() => onSelectNumber(item.number)}
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: item.isWin
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15))'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: item.isSpecial
                      ? '2px solid #ef4444'
                      : item.isWin
                      ? '1px solid var(--accent-emerald)'
                      : '1px solid var(--border-subtle)',
                  }}
                  title="Bấm để xem lịch sử số"
                >
                  <div className={`lottery-ball ${item.isSpecial ? 'ball-rose' : item.isWin ? 'ball-gold' : 'ball-slate'}`} style={{ width: 36, height: 36, fontSize: '1rem' }}>
                    {item.number}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {item.isSpecial ? (
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                        ĐẶC BIỆT
                      </div>
                    ) : item.isWin ? (
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {item.hits} NHÁY
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Trượt
                      </div>
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
};
