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
  Flame,
  Calendar,
  Lock,
  Unlock,
  Filter,
} from 'lucide-react';
import { LotteryIndexData, SummaryData, LatestDrawXSMB } from '../types';

interface XSMBProductHubProps {
  xsmbData: LotteryIndexData | null;
  summaryData: SummaryData | null;
  onSelectNumber: (num: string) => void;
}

type XSMBGeneratorType = 'bach_thu' | 'song_thu' | 'dan_4' | 'dan_10';

export const XSMBProductHub: React.FC<XSMBProductHubProps> = ({
  xsmbData,
  summaryData,
  onSelectNumber,
}) => {
  const [activeTab, setActiveTab] = useState<'quick_pick' | 'quick_checker'>('quick_pick');

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

        <div style={{ display: 'flex', gap: 6 }}>
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
    </div>
  );
};
