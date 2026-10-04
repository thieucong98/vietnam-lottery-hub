import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Calendar,
  Trophy,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Layers,
  Sparkles,
  Filter,
  CheckCircle2,
  Clock,
  BarChart2,
} from 'lucide-react';
import { LotteryIndexData, NumberDetail, NumberAppearance } from '../types';

interface InstantLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  xsmbData: LotteryIndexData | null;
  vietlottData: LotteryIndexData | null;
  initialNumber?: string;
}

export const InstantLookupModal: React.FC<InstantLookupModalProps> = ({
  isOpen,
  onClose,
  xsmbData,
  vietlottData,
  initialNumber = '',
}) => {
  const [activeTabMode, setActiveTabMode] = useState<'single' | 'xien'>('single');
  const [selectedGame, setSelectedGame] = useState<'xsmb' | 'vietlott'>('xsmb');
  const [searchQuery, setSearchQuery] = useState(initialNumber);

  // Xiên 2 inputs
  const [xienNum1, setXienNum1] = useState<string>('68');
  const [xienNum2, setXienNum2] = useState<string>('86');
  const [xienLoading, setXienLoading] = useState<boolean>(false);
  const [xienMatches, setXienMatches] = useState<{ date: string; num1Hits: number; num2Hits: number }[] | null>(null);

  // Bộ lọc lịch sử
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [onlySpecial, setOnlySpecial] = useState<boolean>(false);
  const [onlyMultiHits, setOnlyMultiHits] = useState<boolean>(false);

  // Lazy loaded full history
  const [fullHistoryMap, setFullHistoryMap] = useState<Record<string, NumberAppearance[]>>({});
  const [loadingFullHistory, setLoadingFullHistory] = useState<boolean>(false);

  // Phím Escape để đóng modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Đồng bộ số tìm kiếm khi mở từ ngoài vào
  useEffect(() => {
    if (initialNumber) {
      setSearchQuery(initialNumber);
    }
  }, [initialNumber]);

  const activeData = selectedGame === 'xsmb' ? xsmbData : vietlottData;
  const maxNumber = selectedGame === 'xsmb' ? 99 : 55;

  // Chuẩn hóa số tìm kiếm
  const formattedNumber = useMemo(() => {
    const cleaned = searchQuery.trim();
    if (!cleaned) return '';
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) return '';
    return num.toString().padStart(2, '0');
  }, [searchQuery]);

  const detail: NumberDetail | undefined = useMemo(() => {
    if (!activeData || !activeData.numbers || !formattedNumber) return undefined;
    return activeData.numbers[formattedNumber];
  }, [activeData, formattedNumber]);

  // Tải full history khi người dùng chọn lọc năm hoặc yêu cầu
  const loadFullHistory = async (num: string) => {
    const cacheKey = `${selectedGame}_${num}`;
    if (fullHistoryMap[cacheKey]) return fullHistoryMap[cacheKey];

    try {
      setLoadingFullHistory(true);
      const folder = selectedGame === 'xsmb' ? 'xsmb' : 'vietlott_655';
      const res = await fetch(`./data/history/${folder}/${num}.json`);
      if (res.ok) {
        const data: NumberAppearance[] = await res.json();
        setFullHistoryMap((prev) => ({ ...prev, [cacheKey]: data }));
        return data;
      }
    } catch (e) {
      console.error('Lỗi tải full history:', e);
    } finally {
      setLoadingFullHistory(false);
    }
    return [];
  };

  // Tính toán danh sách ngày hiển thị dựa trên full history hoặc recent_history
  const cacheKey = `${selectedGame}_${formattedNumber}`;
  const loadedFullList = fullHistoryMap[cacheKey];
  const sourceList = loadedFullList || detail?.recent_history || [];

  const filteredHistory = useMemo(() => {
    let list = [...sourceList];
    if (selectedYear !== 'all') {
      list = list.filter((item) => item.date.startsWith(selectedYear));
    }
    if (onlySpecial) {
      list = list.filter((item) => item.is_special);
    }
    if (onlyMultiHits) {
      list = list.filter((item) => (item.hits || 1) >= 2);
    }
    return list;
  }, [sourceList, selectedYear, onlySpecial, onlyMultiHits]);

  // Xử lý tra cứu Xiên 2
  const handleCheckXien = async () => {
    const n1 = xienNum1.trim().padStart(2, '0');
    const n2 = xienNum2.trim().padStart(2, '0');
    if (n1 === n2) return;

    setXienLoading(true);
    try {
      const folder = selectedGame === 'xsmb' ? 'xsmb' : 'vietlott_655';
      const [res1, res2] = await Promise.all([
        fetch(`./data/history/${folder}/${n1}.json`),
        fetch(`./data/history/${folder}/${n2}.json`),
      ]);

      if (res1.ok && res2.ok) {
        const hist1: NumberAppearance[] = await res1.json();
        const hist2: NumberAppearance[] = await res2.json();

        const map1 = new Map(hist1.map((item) => [item.date, item.hits || 1]));
        const matches: { date: string; num1Hits: number; num2Hits: number }[] = [];

        for (const item of hist2) {
          if (map1.has(item.date)) {
            matches.push({
              date: item.date,
              num1Hits: map1.get(item.date) || 1,
              num2Hits: item.hits || 1,
            });
          }
        }
        setXienMatches(matches);
      }
    } catch (err) {
      console.error('Lỗi tra cứu xiên:', err);
    } finally {
      setXienLoading(false);
    }
  };

  if (!isOpen) return null;

  const quickPicks = ['68', '86', '79', '39', '18', '51', '04', '99'];
  const yearsList = ['all', '2026', '2025', '2024', '2023', '2022', '2021', '2020'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 860,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px -5px rgba(245, 158, 11, 0.25)',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.96)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="lottery-ball ball-gold" style={{ width: 38, height: 38, fontSize: '1rem' }}>
              <Search size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Trung Tâm Tra Cứu Lịch Sử & Kiểm Tra Kết Quả
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tra cứu xem số đã về bao giờ chưa, ngày đầu tiên, lần gần nhất, tổng số lần & toàn bộ thời gian xuất hiện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab chuyển đổi chế độ */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '8px 24px',
            gap: 12,
          }}
        >
          <button
            className={`tab-btn ${activeTabMode === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTabMode('single')}
            style={{ fontSize: '0.85rem' }}
          >
            <Search size={15} />
            <span>Tra Cứu Đơn Số (00 - {maxNumber})</span>
          </button>
          <button
            className={`tab-btn ${activeTabMode === 'xien' ? 'active' : ''}`}
            onClick={() => {
              setActiveTabMode('xien');
              if (!xienMatches) handleCheckXien();
            }}
            style={{ fontSize: '0.85rem' }}
          >
            <Layers size={15} />
            <span>Tra Cứu Cặp Lô Xiên (Xiên 2)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {/* ===================== TAB 1: TRA CỨU ĐƠN SỐ ===================== */}
          {activeTabMode === 'single' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Chọn trò chơi & Input Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className={`tab-btn ${selectedGame === 'xsmb' ? 'active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setSelectedGame('xsmb')}
                  >
                    XSMB (00 - 99)
                  </button>
                  <button
                    className={`tab-btn ${selectedGame === 'vietlott' ? 'active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setSelectedGame('vietlott')}
                  >
                    Vietlott Power 6/55 (01 - 55)
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <Search
                    size={22}
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--accent-gold)',
                    }}
                  />
                  <input
                    type="number"
                    placeholder={
                      selectedGame === 'xsmb'
                        ? 'Nhập số loto cần tra cứu (ví dụ: 68, 51, 99)...'
                        : 'Nhập số Vietlott (01 - 55)...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 50px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#ffffff',
                      fontSize: '1.1rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      outline: 'none',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                </div>

                {/* Gợi ý số nhanh */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Gợi ý nhanh:</span>
                  {quickPicks.map((num) => (
                    <button
                      key={num}
                      onClick={() => setSearchQuery(num)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        background: searchQuery === num ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.05)',
                        color: searchQuery === num ? '#000000' : 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* KẾT QUẢ TRA CỨU */}
              {detail ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Banner câu trả lời trực diện */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div
                        className={`lottery-ball ${detail.is_gan ? 'ball-red' : 'ball-gold'}`}
                        style={{ width: 72, height: 72, fontSize: '2rem' }}
                      >
                        {detail.number}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                            Số {detail.number}
                          </span>
                          <span className="badge badge-hot" style={{ fontSize: '0.78rem' }}>
                            <CheckCircle2 size={13} />
                            ĐÃ TỪNG VỀ TRONG LỊCH SỬ
                          </span>
                          {detail.is_gan && (
                            <span className="badge badge-gan" style={{ fontSize: '0.78rem' }}>
                              <AlertTriangle size={13} />
                              ĐANG GAN ({detail.days_since_last} ngày)
                            </span>
                          )}
                        </div>

                        <p style={{ fontSize: '0.92rem', color: '#e2e8f0', margin: '4px 0' }}>
                          {detail.days_since_last === 0
                            ? '🔥 ĐÃ VỀ HÔM NAY trong kỳ quay mới nhất!'
                            : detail.days_since_last === 1
                            ? '⭐ Vừa về ngày hôm qua!'
                            : `Lần gần nhất xuất hiện: ${detail.last_seen_date} (Cách đây ${detail.days_since_last} ngày)`}
                        </p>

                        {detail.first_seen_date && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Lần đầu tiên có trong cơ sở dữ liệu: <strong>{detail.first_seen_date}</strong> (Hơn 20 năm
                            lịch sử)
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-dim)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Tổng số lần đã về
                      </div>
                      <div
                        style={{
                          fontSize: '2.1rem',
                          fontWeight: 800,
                          color: 'var(--accent-gold)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {detail.total_hits.toLocaleString()}{' '}
                        <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>lần</span>
                      </div>
                      {detail.special_hits !== undefined && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 600 }}>
                          Trúng Giải Đặc Biệt (Đề): {detail.special_hits} lần
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grid 4 thẻ thống kê nhịp & tần suất */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: 12,
                    }}
                  >
                    <div className="glass-card" style={{ padding: 14 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Số ngày chưa về (Hiện tại)</div>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          color: detail.is_gan ? 'var(--accent-red)' : '#ffffff',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {detail.days_since_last} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>ngày</span>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: 14 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Kỷ lục gan lớn nhất lịch sử</div>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          color: 'var(--accent-gold)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {detail.max_gap_historical} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>ngày</span>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: 14 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Chu kỳ nhịp trung bình</div>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          color: 'var(--accent-cyan)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {detail.average_gap} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>ngày/lần</span>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: 14 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Tần suất 30 ngày qua</div>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          color: 'var(--accent-emerald)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {detail.freq_30d} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>nháy</span>
                      </div>
                    </div>
                  </div>

                  {/* Biểu đồ phân bố xuất hiện theo năm (Yearly Distribution) */}
                  {detail.yearly_distribution && Object.keys(detail.yearly_distribution).length > 0 && (
                    <div className="glass-card" style={{ padding: 16 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <BarChart2 size={16} color="var(--accent-cyan)" />
                          Phân Bố Số Lần Về Theo Từng Năm (2005 - 2026)
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          Click vào năm để lọc danh sách
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: 6,
                          height: 75,
                          paddingTop: 10,
                          overflowX: 'auto',
                        }}
                      >
                        {Object.entries(detail.yearly_distribution).map(([yr, count]) => {
                          const maxCount = Math.max(...Object.values(detail.yearly_distribution || {}));
                          const heightPct = Math.max(15, Math.round((count / (maxCount || 1)) * 100));
                          const isSelected = selectedYear === yr;
                          return (
                            <div
                              key={yr}
                              onClick={async () => {
                                setSelectedYear(isSelected ? 'all' : yr);
                                if (!loadedFullList) await loadFullHistory(detail.number);
                              }}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                                flex: '1 0 28px',
                                cursor: 'pointer',
                              }}
                            >
                              <span style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                                {count}
                              </span>
                              <div
                                style={{
                                  width: '100%',
                                  height: `${heightPct}%`,
                                  background: isSelected
                                    ? 'var(--accent-gold)'
                                    : 'linear-gradient(180deg, rgba(56, 189, 248, 0.8), rgba(59, 130, 246, 0.4))',
                                  borderRadius: '3px 3px 0 0',
                                  transition: 'height 0.3s ease',
                                }}
                              />
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  color: isSelected ? 'var(--accent-gold)' : 'var(--text-dim)',
                                  fontWeight: isSelected ? 800 : 500,
                                }}
                              >
                                {yr.slice(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bạc nhớ / Cặp số hay về cùng */}
                  {detail.top_pairs && detail.top_pairs.length > 0 && (
                    <div className="glass-card" style={{ padding: 16 }}>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          marginBottom: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Layers size={16} color="var(--accent-cyan)" />
                        Cặp số hay về cùng {detail.number} nhất (Thống kê 1 năm qua)
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {detail.top_pairs.map((p) => (
                          <div
                            key={p.number}
                            onClick={() => setSearchQuery(p.number)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid var(--border-subtle)',
                              cursor: 'pointer',
                            }}
                          >
                            <span
                              className="lottery-ball ball-slate"
                              style={{ width: 26, height: 26, fontSize: '0.8rem' }}
                            >
                              {p.number}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              cùng về <strong style={{ color: 'var(--accent-gold)' }}>{p.co_count}</strong> lần
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DÒNG THỜI GIAN TOÀN BỘ CÁC LẦN XUẤT HIỆN */}
                  <div className="glass-card" style={{ padding: 18 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Calendar size={17} color="var(--accent-emerald)" />
                        <span>
                          Dòng Thời Gian Xuất Hiện (
                          {loadedFullList
                            ? `Toàn bộ ${filteredHistory.length}/${detail.total_hits} lần`
                            : `Đang xem ${filteredHistory.length} lần gần nhất`}
                          )
                        </span>
                      </div>

                      {/* Nút tải full lịch sử nếu chưa tải */}
                      {!loadedFullList && (
                        <button
                          onClick={() => loadFullHistory(detail.number)}
                          disabled={loadingFullHistory}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid var(--accent-cyan)',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {loadingFullHistory
                            ? 'Đang tải...'
                            : `⚡ Tải Toàn Bộ 20 Năm Lịch Sử (${detail.total_hits} Lần)`}
                        </button>
                      )}
                    </div>

                    {/* Bộ lọc Năm & Tùy chọn */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                        marginBottom: 12,
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Filter size={14} color="var(--text-dim)" />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Năm:</span>
                        <select
                          value={selectedYear}
                          onChange={async (e) => {
                            const yr = e.target.value;
                            setSelectedYear(yr);
                            if (yr !== 'all' && !loadedFullList) {
                              await loadFullHistory(detail.number);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(30, 41, 59, 0.8)',
                            color: '#ffffff',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.8rem',
                            outline: 'none',
                          }}
                        >
                          <option value="all">Tất cả các năm (2005 - 2026)</option>
                          {yearsList
                            .filter((y) => y !== 'all')
                            .map((y) => (
                              <option key={y} value={y}>
                                Năm {y}
                              </option>
                            ))}
                        </select>
                      </div>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.78rem',
                          color: onlySpecial ? 'var(--accent-red)' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={onlySpecial}
                          onChange={(e) => setOnlySpecial(e.target.checked)}
                        />
                        Chỉ hiện Giải Đặc Biệt (Đề)
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.78rem',
                          color: onlyMultiHits ? 'var(--accent-gold)' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={onlyMultiHits}
                          onChange={(e) => setOnlyMultiHits(e.target.checked)}
                        />
                        Chỉ hiện về ≥ 2 nháy
                      </label>
                    </div>

                    {/* Bảng danh sách các ngày đã về */}
                    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              color: 'var(--text-dim)',
                              textAlign: 'left',
                            }}
                          >
                            <th style={{ padding: '8px 10px' }}>Ngày quay</th>
                            <th style={{ padding: '8px 10px' }}>Số nháy</th>
                            <th style={{ padding: '8px 10px' }}>Chi tiết giải trúng</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.length > 0 ? (
                            filteredHistory.map((hist, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                  {hist.date}
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <span className="badge badge-hot" style={{ fontSize: '0.72rem' }}>
                                    {hist.hits || 1} nháy
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: '8px 10px',
                                    color: hist.is_special ? 'var(--accent-red)' : 'var(--text-muted)',
                                    fontWeight: hist.is_special ? 700 : 400,
                                  }}
                                >
                                  {hist.is_special && '★ GIẢI ĐẶC BIỆT (ĐỀ) • '}
                                  {hist.prizes ? hist.prizes.join(', ') : hist.id ? `Kỳ #${hist.id}` : 'Trúng thưởng'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                                Không có lần xuất hiện nào khớp với bộ lọc.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : searchQuery ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: 8 }}>Không tìm thấy dữ liệu cho số "{searchQuery}"</p>
                  <p style={{ fontSize: '0.85rem' }}>Vui lòng nhập một số hợp lệ từ 00 đến {maxNumber}.</p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                  <Search size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                    Nhập số bất kỳ ở ô trên để tra cứu ngay lịch sử và chu kỳ gan!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 2: TRA CỨU CẶP LÔ XIÊN 2 ===================== */}
          {activeTabMode === 'xien' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  padding: 18,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 6, color: '#ffffff' }}>
                  Kiểm Tra Lịch Sử Xuất Hiện Cặp Lô Xiên (Xiên 2)
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Kiểm tra xem cặp số này đã bao giờ cùng nổ trong 1 ngày chưa, tổng cộng bao nhiêu lần và lần gần nhất là
                  khi nào.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Số 1:</span>
                    <input
                      type="number"
                      value={xienNum1}
                      onChange={(e) => setXienNum1(e.target.value)}
                      style={{
                        width: 80,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--accent-gold)',
                        color: '#ffffff',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        textAlign: 'center',
                      }}
                    />
                  </div>

                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>+</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Số 2:</span>
                    <input
                      type="number"
                      value={xienNum2}
                      onChange={(e) => setXienNum2(e.target.value)}
                      style={{
                        width: 80,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--accent-gold)',
                        color: '#ffffff',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        textAlign: 'center',
                      }}
                    />
                  </div>

                  <button
                    onClick={handleCheckXien}
                    disabled={xienLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-gold)',
                      color: '#000000',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {xienLoading ? 'Đang phân tích...' : 'Kiểm Tra Cặp Xiên Ngay'}
                  </button>
                </div>
              </div>

              {/* Kết quả xiên */}
              {xienMatches !== null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div className="lottery-ball ball-gold" style={{ width: 48, height: 48, fontSize: '1.25rem' }}>
                          {xienNum1.padStart(2, '0')}
                        </div>
                        <div
                          className="lottery-ball ball-gold"
                          style={{ width: 48, height: 48, fontSize: '1.25rem', background: '#3b82f6' }}
                        >
                          {xienNum2.padStart(2, '0')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                          Cặp Xiên {xienNum1.padStart(2, '0')} - {xienNum2.padStart(2, '0')}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {xienMatches.length > 0
                            ? `Lần gần nhất cùng về: ${xienMatches[0].date}`
                            : 'Chưa từng cùng xuất hiện trong một ngày'}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        Tổng số lần cùng về
                      </div>
                      <div
                        style={{
                          fontSize: '1.8rem',
                          fontWeight: 800,
                          color: 'var(--accent-gold)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {xienMatches.length} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>ngày</span>
                      </div>
                    </div>
                  </div>

                  {/* Bảng các ngày cùng nổ */}
                  <div className="glass-card" style={{ padding: 16 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 12 }}>
                      Danh Sách Các Ngày Cả 2 Số Cùng Xuất Hiện ({xienMatches.length} ngày)
                    </div>
                    <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              color: 'var(--text-dim)',
                              textAlign: 'left',
                            }}
                          >
                            <th style={{ padding: '8px 10px' }}>Ngày quay</th>
                            <th style={{ padding: '8px 10px' }}>Số {xienNum1}</th>
                            <th style={{ padding: '8px 10px' }}>Số {xienNum2}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {xienMatches.map((m, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                {m.date}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <span className="badge badge-hot" style={{ fontSize: '0.72rem' }}>
                                  {m.num1Hits} nháy
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <span className="badge badge-normal" style={{ fontSize: '0.72rem' }}>
                                  {m.num2Hits} nháy
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
