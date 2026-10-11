import React, { useState, useMemo } from 'react';
import {
  Dice5,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Search,
  Trophy,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  MapPin,
} from 'lucide-react';
import {
  LotteryIndexData,
  SummaryData,
  LatestDrawXSMB,
  XSMBHistoricalDraw,
} from '../types';

interface XSMBProductHubProps {
  xsmbData: LotteryIndexData | null;
  summaryData: SummaryData | null;
  historicalDraws?: XSMBHistoricalDraw[];
  onSelectNumber: (num: string) => void;
  onSelectHistoricalDraw?: (draw: XSMBHistoricalDraw) => void;
  selectedDrawDate?: string;
}

type XSMBGeneratorType = 'bach_thu' | 'song_thu' | 'dan_4' | 'dan_10';
type XSMBHubTab = 'quick_pick' | 'quick_checker' | 'history';
type HistoryTimeRange = '7' | '30' | '90' | 'all';

export const XSMBProductHub: React.FC<XSMBProductHubProps> = ({
  xsmbData,
  summaryData,
  historicalDraws = [],
  onSelectNumber,
  onSelectHistoricalDraw,
  selectedDrawDate,
}) => {
  const [activeTab, setActiveTab] = useState<XSMBHubTab>('quick_pick');

  // --- HISTORY STATE ---
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyRange, setHistoryRange] = useState<HistoryTimeRange>('30');
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [expandedDrawDate, setExpandedDrawDate] = useState<string | null>(null);

  // --- QUICK PICK STATE ---
  const [genType, setGenType] = useState<XSMBGeneratorType>('song_thu');
  const [generatedList, setGeneratedList] = useState<string[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // --- CHECKER STATE ---
  const [checkInput, setCheckInput] = useState<string>('');
  const [checkResult, setCheckResult] = useState<{
    query: string;
    hits: number;
    prizes: string[];
    isSpecial: boolean;
  } | null>(null);

  // Lọc danh sách lịch sử kỳ quay
  const filteredHistory = useMemo(() => {
    const list = historicalDraws || [];

    // Nếu người dùng đang tìm kiếm, tìm kiếm trên toàn bộ kỳ quay đã nạp
    if (historySearch.trim()) {
      const query = historySearch.trim().toLowerCase();
      return list.filter((draw) => {
        if (draw.date.includes(query)) return true;
        if (draw.day_of_week?.toLowerCase().includes(query)) return true;
        if (draw.province?.toLowerCase().includes(query)) return true;
        if (draw.special_2d === query) return true;
        if (draw.special?.includes(query)) return true;
        if (draw.prize1?.includes(query)) return true;
        return false;
      });
    }

    // Nếu không tìm kiếm, áp dụng bộ lọc khoảng thời gian nhanh (7, 30, 90, all)
    if (historyRange === '7') {
      return list.slice(0, 7);
    } else if (historyRange === '30') {
      return list.slice(0, 30);
    } else if (historyRange === '90') {
      return list.slice(0, 90);
    }
    return list;
  }, [historicalDraws, historyRange, historySearch]);

  const historyPageSize = 8;
  const totalHistoryPages = Math.max(1, Math.ceil(filteredHistory.length / historyPageSize));
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return filteredHistory.slice(start, start + historyPageSize);
  }, [filteredHistory, historyPage]);


  // Lấy dữ liệu mở thưởng mới nhất
  const latestDraw = (xsmbData?.latest_draw || summaryData?.xsmb_latest) as LatestDrawXSMB | undefined;
  const lotoList = latestDraw?.loto_numbers || [];
  const rawPrizes = latestDraw?.raw_prizes || {};

  // Danh sách top hot & gan
  const topGan = useMemo(() => {
    return xsmbData?.top_gan?.slice(0, 10).map((g) => g.number) || [];
  }, [xsmbData]);

  const topHot = useMemo(() => {
    return xsmbData?.top_frequent?.slice(0, 15).map((f) => f.number) || [];
  }, [xsmbData]);

  // Thuật toán Quick Pick 2 số cho XSMB
  const handleGenerate = () => {
    setIsRolling(true);
    setCopied(false);

    setTimeout(() => {
      let count = 2;
      if (genType === 'bach_thu') count = 1;
      else if (genType === 'song_thu') count = 2;
      else if (genType === 'dan_4') count = 4;
      else if (genType === 'dan_10') count = 10;

      const chosen: string[] = [];

      if (genType === 'song_thu') {
        // Sinh 1 cặp số lộn (ví dụ 38 - 83)
        const d1 = Math.floor(Math.random() * 10);
        const d2 = Math.floor(Math.random() * 10);
        const n1 = `${d1}${d2}`;
        const n2 = `${d2}${d1}`;
        chosen.push(n1);
        if (n1 !== n2) chosen.push(n2);
        else {
          const alt = ((parseInt(n1, 10) + 11) % 100).toString().padStart(2, '0');
          chosen.push(alt);
        }
      } else {
        // Kết hợp số Hot và ngẫu nhiên cân bằng
        const pool = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0')).filter(
          (n) => !topGan.includes(n) // Tránh số cực gan
        );

        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        for (const num of shuffled) {
          if (chosen.length >= count) break;
          if (!chosen.includes(num)) chosen.push(num);
        }
      }

      setGeneratedList(chosen);
      setIsRolling(false);
    }, 250);
  };

  // Dò vé XSMB
  const handleCheck = () => {
    const raw = checkInput.trim();
    if (!raw) return;

    // Lấy 2 chữ số cuối
    const last2 = raw.length >= 2 ? raw.slice(-2) : raw.padStart(2, '0');

    // Đếm số nháy loto
    const hits = lotoList.filter((n) => n === last2).length;

    // Tìm các giải thưởng cụ thể
    const matchedPrizes: string[] = [];
    let isSpecial = false;

    for (const [pKey, pVal] of Object.entries(rawPrizes)) {
      if (pVal === null || pVal === undefined) continue;
      const strVal = pVal.toString();
      if (strVal.endsWith(last2)) {
        let pLabel = pKey;
        if (pKey === 'special') {
          pLabel = 'Giải Đặc Biệt';
          isSpecial = true;
        } else if (pKey === 'prize1') pLabel = 'Giải Nhất';
        else if (pKey.startsWith('prize2')) pLabel = 'Giải Nhì';
        else if (pKey.startsWith('prize3')) pLabel = 'Giải Ba';
        else if (pKey.startsWith('prize4')) pLabel = 'Giải Tư';
        else if (pKey.startsWith('prize5')) pLabel = 'Giải Năm';
        else if (pKey.startsWith('prize6')) pLabel = 'Giải Sáu';
        else if (pKey.startsWith('prize7')) pLabel = 'Giải Bảy';
        matchedPrizes.push(`${pLabel} (${strVal})`);
      }
    }

    setCheckResult({
      query: raw,
      hits,
      prizes: matchedPrizes,
      isSpecial,
    });
  };

  const handleCopy = () => {
    if (generatedList.length === 0) return;
    navigator.clipboard.writeText(`XSMB Gợi Ý: ${generatedList.join(', ')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        padding: '20px 24px',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.95))',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header & Sub-tab switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontWeight: 800,
              fontSize: '0.8rem',
            }}
          >
            TOOLKIT XSMB
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
            Công Cụ Hỗ Trợ Người Chơi Tại Chỗ
          </h3>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('quick_pick')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              borderColor: activeTab === 'quick_pick' ? 'var(--accent-gold)' : 'var(--border-subtle)',
              background: activeTab === 'quick_pick' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: activeTab === 'quick_pick' ? 'var(--accent-gold)' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Dice5 size={15} />
            <span>Gợi Ý Bộ Số (Quick Pick)</span>
          </button>

          <button
            onClick={() => setActiveTab('quick_checker')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              borderColor: activeTab === 'quick_checker' ? 'var(--accent-emerald)' : 'var(--border-subtle)',
              background: activeTab === 'quick_checker' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'quick_checker' ? 'var(--accent-emerald)' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckCircle2 size={15} />
            <span>Dò Vé 1 Giây</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setHistoryPage(1);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              borderColor: activeTab === 'history' ? '#8b5cf6' : 'var(--border-subtle)',
              background: activeTab === 'history' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              color: activeTab === 'history' ? '#c084fc' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Calendar size={15} />
            <span>Lịch Sử Kỳ Quay ({historicalDraws.length})</span>
          </button>
        </div>
      </div>


      {/* 1. QUICK PICK 2D */}
      {activeTab === 'quick_pick' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Chọn kiểu bộ số mong muốn (Tránh số gan, tối ưu theo nhịp loto):
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'song_thu', label: 'Song Thủ (Cặp Lộn)' },
                { id: 'bach_thu', label: 'Bạch Thủ (1 Số)' },
                { id: 'dan_4', label: 'Dàn 4 Số' },
                { id: 'dan_10', label: 'Dàn 10 Số' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setGenType(t.id as XSMBGeneratorType)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: genType === t.id ? 'var(--accent-gold)' : 'rgba(255,255,255,0.08)',
                    background: genType === t.id ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                    color: genType === t.id ? 'var(--accent-gold)' : 'var(--text-muted)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {generatedList.length === 0 ? (
                <span style={{ fontSize: '0.84rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  Bấm "Gợi Ý Bộ Số" để máy tính sinh bộ số ngẫu nhiên theo thuật toán...
                </span>
              ) : (
                generatedList.map((num) => (
                  <div
                    key={num}
                    className="lottery-ball ball-gold"
                    style={{ width: 44, height: 44, fontSize: '1.2rem', cursor: 'pointer' }}
                    onClick={() => onSelectNumber(num)}
                    title={`Bấm để xem lịch sử số ${num}`}
                  >
                    {num}
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleGenerate}
                disabled={isRolling}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: isRolling ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <RefreshCw size={14} style={{ animation: isRolling ? 'spin 0.6s linear infinite' : undefined }} />
                <span>{generatedList.length === 0 ? 'Gợi Ý Bộ Số' : 'Đổi Bộ Khác'}</span>
              </button>

              {generatedList.length > 0 && (
                <button
                  onClick={handleCopy}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. QUICK CHECKER */}
      {activeTab === 'quick_checker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Nhập 2 số loto (ví dụ: 68) hoặc số vé 5 chữ số..."
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
                      ? `🎉 CHÚC MỪNG! Số này đã về ${checkResult.hits} nháy trong kỳ mở thưởng hôm nay.`
                      : 'Tiếc quá! Số này chưa xuất hiện trong bảng mở thưởng hôm nay.'}
                  </div>
                </div>

                {checkResult.isSpecial && (
                  <span className="badge badge-hot" style={{ fontSize: '0.8rem' }}>
                    🏆 TRÚNG GIẢI ĐẶC BIỆT!
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
      )}

      {/* 3. KHO LỊCH SỬ KỲ QUAY XSMB */}
      {activeTab === 'history' && (
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
                  placeholder="Tìm theo ngày (2026-10-09) hoặc số Đề (53)..."
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setHistoryPage(1);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
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
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
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
                            title={`Bấm xem lịch sử Đề ${draw.special_2d}`}
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
                            ĐỀ {draw.special_2d}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Giải Nhất:</span>
                          <span className="mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
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
                              color: isSelectedOnBoard ? '#ffffff' : 'var(--text-muted)',
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
                              <span className="mono" style={{ color: '#ffffff', fontWeight: 700 }}>{draw.prize1}</span>
                            </div>

                            {/* G2 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <span style={{ color: 'var(--text-dim)' }}>Giải Nhì</span>
                              <span className="mono" style={{ color: '#ffffff', fontWeight: 700 }}>
                                {[draw.raw_prizes.prize2_1, draw.raw_prizes.prize2_2].map((v) => `${v}`.padStart(5, '0')).join(' - ')}
                              </span>
                            </div>

                            {/* G3 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <span style={{ color: 'var(--text-dim)' }}>Giải Ba</span>
                              <span className="mono" style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.78rem' }}>
                                {[draw.raw_prizes.prize3_1, draw.raw_prizes.prize3_2, draw.raw_prizes.prize3_3, draw.raw_prizes.prize3_4, draw.raw_prizes.prize3_5, draw.raw_prizes.prize3_6].map((v) => `${v}`.padStart(5, '0')).join(' ')}
                              </span>
                            </div>

                            {/* G4 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <span style={{ color: 'var(--text-dim)' }}>Giải Tư</span>
                              <span className="mono" style={{ color: '#ffffff', fontWeight: 700 }}>
                                {[draw.raw_prizes.prize4_1, draw.raw_prizes.prize4_2, draw.raw_prizes.prize4_3, draw.raw_prizes.prize4_4].map((v) => `${v}`.padStart(4, '0')).join(' - ')}
                              </span>
                            </div>

                            {/* G5 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <span style={{ color: 'var(--text-dim)' }}>Giải Năm</span>
                              <span className="mono" style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.78rem' }}>
                                {[draw.raw_prizes.prize5_1, draw.raw_prizes.prize5_2, draw.raw_prizes.prize5_3, draw.raw_prizes.prize5_4, draw.raw_prizes.prize5_5, draw.raw_prizes.prize5_6].map((v) => `${v}`.padStart(4, '0')).join(' ')}
                              </span>
                            </div>

                            {/* G6 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <span style={{ color: 'var(--text-dim)' }}>Giải Sáu</span>
                              <span className="mono" style={{ color: '#ffffff', fontWeight: 700 }}>
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
                                            color: '#ffffff',
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
                  color: historyPage === 1 ? 'var(--text-dim)' : '#ffffff',
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
                Trang <strong style={{ color: '#ffffff' }}>{historyPage}</strong> / {totalHistoryPages}
              </span>

              <button
                disabled={historyPage >= totalHistoryPages}
                onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(255,255,255,0.05)',
                  color: historyPage >= totalHistoryPages ? 'var(--text-dim)' : '#ffffff',
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
      )}
    </div>
  );
};

