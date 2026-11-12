import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Download, Link2, ListChecks, Share2 } from 'lucide-react';
import { Ball, Button, Card } from '../ui';
import { gameFromParam, paths, ToolGame, XSMB_DATE_PATTERN } from '../app/routes';
import { GameSelect, ToolsLayout } from '../features/tools/ToolsLayout';
import { canvasToBlob, drawShareImage, ShareImageContent } from '../features/draw-lookup/shareImage';
import { OfficialResultsLink } from '../components/OfficialResultsLink';
import { useDataset } from '../data/useData';
import { formatVnDate } from '../utils/drawSchedule';
import { formatBallNumber } from '../utils/lotteryUtils';
import { XSMB_TIERS } from '../utils/xsmbTicket';
import type { VietlottHistoricalDraw, XSMBHistoricalDraw } from '../types';
import styles from '../features/tools/tools.module.css';

const XSMB_ROWS: { prefix: string; label: string; width: number }[] = [
  { prefix: 'special', label: 'Đặc Biệt', width: 5 },
  { prefix: 'prize1', label: 'Giải Nhất', width: 5 },
  { prefix: 'prize2', label: 'Giải Nhì', width: 5 },
  { prefix: 'prize3', label: 'Giải Ba', width: 5 },
  { prefix: 'prize4', label: 'Giải Tư', width: 4 },
  { prefix: 'prize5', label: 'Giải Năm', width: 4 },
  { prefix: 'prize6', label: 'Giải Sáu', width: 3 },
  { prefix: 'prize7', label: 'Giải Bảy', width: 2 },
];

function xsmbPrizeRows(draw: XSMBHistoricalDraw): [string, string[]][] {
  const raw = draw.raw_prizes ?? {};
  return XSMB_ROWS.map(({ prefix, label, width }) => [
    label,
    Object.entries(raw)
      .filter(([k]) => k === prefix || k.startsWith(`${prefix}_`))
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([, v]) => String(v).padStart(width, '0')),
  ]);
}

const LABEL: Record<ToolGame, string> = { xsmb: 'XSMB', vietlott_655: 'Power 6/55', vietlott_645: 'Mega 6/45' };

/** Tra cứu kết quả theo ngày hoặc kỳ, chia sẻ dạng ảnh/link. URL: /ket-qua/xsmb/2026-11-11, /ket-qua/655/01422 */
export default function DrawLookupPage() {
  const params = useParams();
  const navigate = useNavigate();
  const game = gameFromParam(params.game) as ToolGame;
  const key = params.key ?? '';
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState(key);

  const xsmb = useDataset('xsmbDraws', game === 'xsmb');
  const v655 = useDataset('vietlott655Draws', game === 'vietlott_655');
  const v645 = useDataset('vietlott645Draws', game === 'vietlott_645');
  const vietlottDraws = game === 'vietlott_655' ? v655.data?.draws : game === 'vietlott_645' ? v645.data?.draws : undefined;
  const loading = game === 'xsmb' ? xsmb.loading : game === 'vietlott_655' ? v655.loading : v645.loading;
  const loadError = game === 'xsmb' ? xsmb.error : game === 'vietlott_655' ? v655.error : v645.error;

  let xsmbDraw: XSMBHistoricalDraw | undefined;
  let vDraw: VietlottHistoricalDraw | undefined;
  if (game === 'xsmb' && xsmb.data) xsmbDraw = key ? xsmb.data.find((d) => d.date === key) : xsmb.data[0];
  if (game !== 'xsmb' && vietlottDraws) {
    const sorted = vietlottDraws;
    vDraw = key
      ? sorted.find((d) => d.date === key || d.id.replace(/^0+/, '') === key.replace(/^0+/, ''))
      : sorted.reduce<VietlottHistoricalDraw | undefined>((best, d) => (!best || d.date > best.date ? d : best), undefined);
  }
  const found = Boolean(xsmbDraw || vDraw);
  const drawDate = xsmbDraw?.date ?? vDraw?.date;

  const go = (g: ToolGame, k?: string) => navigate(paths.result(g, k), { replace: true });

  const submit = () => {
    const q = query.trim();
    if (game === 'xsmb' && q && !XSMB_DATE_PATTERN.test(q)) {
      setMessage('Nhập ngày dạng YYYY-MM-DD');
      return;
    }
    setMessage(null);
    go(game, q || undefined);
  };

  const shareContent = (): ShareImageContent | null => {
    const footer = 'Kết quả tổng hợp tự động, đối chiếu với nguồn chính thức. Chơi có trách nhiệm, chỉ dành cho người từ 18 tuổi.';
    if (xsmbDraw) {
      return {
        title: `Kết quả XSMB ${formatVnDate(xsmbDraw.date)}`,
        subtitle: xsmbDraw.province ? `Đài ${xsmbDraw.province} · thieucong98.github.io/vietnam-lottery-hub` : 'thieucong98.github.io/vietnam-lottery-hub',
        rows: xsmbPrizeRows(xsmbDraw).map(([label, nums], i) => [label, nums.join('  '), i === 0]),
        footer,
      };
    }
    if (vDraw) {
      const balls = vDraw.balls.map(formatBallNumber).join('  ');
      return {
        title: `Kết quả ${LABEL[game]} kỳ #${vDraw.id}`,
        subtitle: `${formatVnDate(vDraw.date)} · thieucong98.github.io/vietnam-lottery-hub`,
        rows: [
          ['Bộ số', balls, true],
          ...(game === 'vietlott_655' && vDraw.special != null ? ([['Bóng đặc biệt', formatBallNumber(vDraw.special)]] as [string, string][]) : []),
        ],
        footer,
      };
    }
    return null;
  };

  const shareUrl = () => `${window.location.origin}${window.location.pathname}#${paths.result(game, xsmbDraw?.date ?? vDraw?.id)}`;
  const fileName = () => `ket-qua-${game === 'xsmb' ? 'xsmb' : game.slice(-3)}-${drawDate ?? 'moi-nhat'}.png`;

  const downloadImage = async () => {
    const content = shareContent();
    if (!content) return;
    const blob = await canvasToBlob(drawShareImage(content));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName();
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    const content = shareContent();
    if (!content) return;
    try {
      const blob = await canvasToBlob(drawShareImage(content));
      const file = blob ? new File([blob], fileName(), { type: 'image/png' }) : null;
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: content.title, url: shareUrl() });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: content.title, url: shareUrl() });
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    await copyLink();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setMessage('Đã sao chép liên kết kết quả.');
    } catch {
      setMessage(shareUrl());
    }
  };

  return (
    <ToolsLayout
      active="results"
      title="Tra cứu kết quả theo ngày / kỳ"
      intro="Chọn loại xổ số, nhập ngày (XSMB, Vietlott) hoặc mã kỳ (Vietlott). Mỗi kết quả có liên kết riêng để chia sẻ, kèm ảnh tạo ngay trên máy."
    >
      <Card>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="lookup-game">
              Loại xổ số
            </label>
            <GameSelect
              id="lookup-game"
              value={game}
              onChange={(g) => {
                setQuery('');
                go(g);
              }}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="lookup-key">
              {game === 'xsmb' ? 'Ngày quay' : 'Ngày quay hoặc mã kỳ'}
            </label>
            {game === 'xsmb' ? (
              <input id="lookup-key" type="date" className={styles.input} value={query} onChange={(e) => setQuery(e.target.value)} />
            ) : (
              <input
                id="lookup-key"
                className={`${styles.input} ${styles.mono}`}
                placeholder="2026-11-10 hoặc 01422"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            )}
          </div>
          <div className={styles.field}>
            <span className={styles.label} aria-hidden>
              &nbsp;
            </span>
            <Button variant="emerald" onClick={submit}>
              Xem kết quả
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title={found ? (xsmbDraw ? `XSMB ${formatVnDate(xsmbDraw.date)}` : `${LABEL[game]} kỳ #${vDraw!.id} · ${formatVnDate(vDraw!.date)}`) : 'Kết quả'}
        actions={
          found ? (
            <div className={styles.row}>
              <Button size="sm" icon={<Share2 size={14} />} onClick={share}>
                Chia sẻ
              </Button>
              <Button size="sm" variant="ghost" icon={<Download size={14} />} onClick={downloadImage}>
                Tải ảnh
              </Button>
              <Button size="sm" variant="ghost" icon={<Link2 size={14} />} onClick={copyLink}>
                Sao chép liên kết
              </Button>
            </div>
          ) : undefined
        }
      >
        {message && (
          <div className={`${styles.notice} ${styles.noticeOk}`} role="status">
            {message}
          </div>
        )}
        {loading && <p className={styles.small}>Đang tải kết quả...</p>}
        {loadError && <div className={`${styles.notice} ${styles.noticeDanger}`}>Không tải được dữ liệu. Kiểm tra kết nối mạng.</div>}
        {!loading && !loadError && !found && (
          <div className={`${styles.notice} ${styles.noticeWarn}`}>
            Không tìm thấy kỳ {key}. {game === 'xsmb' ? 'Dữ liệu XSMB trên trang có 365 kỳ gần nhất.' : 'Kiểm tra lại ngày quay hoặc mã kỳ.'}
          </div>
        )}

        {xsmbDraw && (
          <table className={styles.prizeTable} data-testid="xsmb-result">
            <caption className="sr-only">Bảng kết quả XSMB ngày {xsmbDraw.date}</caption>
            <tbody>
              {xsmbPrizeRows(xsmbDraw).map(([label, nums], i) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>
                    <div className={`${styles.prizeNumbers} ${i === 0 ? styles.prizeSpecial : ''}`}>
                      {nums.map((n, j) => (
                        <span key={j}>{n}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {vDraw && (
          <div className={styles.stack} data-testid="vietlott-result">
            <div className={styles.balls}>
              {vDraw.balls.map((b) => (
                <Ball key={b} value={b} size="lg" tone="gold" />
              ))}
              {game === 'vietlott_655' && vDraw.special != null && (
                <>
                  <span className={styles.muted} aria-hidden>
                    |
                  </span>
                  <Ball value={vDraw.special} size="lg" tone="jackpot2" title={`Bóng đặc biệt ${formatBallNumber(vDraw.special)}`} />
                </>
              )}
            </div>
            {game === 'vietlott_655' && <p className={styles.hint}>Bóng đặc biệt chỉ dùng cho Jackpot 2 (trùng 5 số chính và bóng đặc biệt).</p>}
          </div>
        )}

        {found && (
          <div className={styles.row}>
            <Link to={paths.check(game, drawDate)} className={styles.small}>
              <ListChecks size={13} /> Dò vé kỳ này
            </Link>
            {xsmbDraw && (
              <span className={styles.hint}>
                Cơ cấu giải vé 10.000đ: {XSMB_TIERS.map((t) => `${t.label} trùng ${t.digits} số`).join('; ')}.
              </span>
            )}
          </div>
        )}
        <OfficialResultsLink sources={game === 'xsmb' ? ['xsktThuDo'] : ['vietlott']} />
      </Card>
    </ToolsLayout>
  );
}
