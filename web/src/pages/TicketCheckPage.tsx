import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Link2, Save, Search } from 'lucide-react';
import { Button, Card } from '../ui';
import { GAME_PARAM, gameFromParam, parseTicketParam, paths, ToolGame } from '../app/routes';
import { GameSelect, ToolsLayout } from '../features/tools/ToolsLayout';
import { checkAgainstDraw, outcomeHasPrize, TicketOutcome } from '../features/tickets/evaluate';
import { OutcomeView } from '../features/tickets/OutcomeView';
import { useDrawLookup } from '../features/tickets/useDrawLookup';
import { useLatestDates, useMyTickets } from '../features/tickets/useMyTickets';
import { OfficialResultsLink } from '../components/OfficialResultsLink';
import { isDrawDay, isValidDate, previousDrawDate } from '../utils/drawSchedule';
import { addTickets, createTicket, SavedTicket } from '../utils/myTickets';
import { parseXsmbTickets } from '../utils/xsmbTicket';
import { parseVietlottTickets, VIETLOTT_JACKPOT_ODDS } from '../utils/vietlottTicket';
import type { VietlottHistoricalDraw, XSMBHistoricalDraw } from '../types';
import { useSummary } from './useSummary';
import styles from '../features/tools/tools.module.css';

interface Row {
  input: string;
  numbers?: string;
  error?: string;
  outcome?: TicketOutcome;
}

const PLACEHOLDER: Record<ToolGame, string> = {
  xsmb: 'Mỗi vé 5 chữ số, cách nhau bởi dấu cách, dấu phẩy hoặc xuống dòng.\nVí dụ: 74129 00972 12351',
  vietlott_655: 'Mỗi dòng một vé: 6 số (vé thường) hoặc 5, 7-18 số (vé bao).\nVí dụ:\n01 02 21 38 39 51\n05 12 19 26 33 40 47',
  vietlott_645: 'Mỗi dòng một vé: 6 số (vé thường) hoặc 5, 7-18 số (vé bao).\nVí dụ:\n03 11 14 23 25 43',
};

/** Dò vé nhiều vé một lúc. URL: /do-ve?game=655&ngay=2026-11-10&ve=01-02-21-38-39-51.03-05-07-09-11-13 */
export default function TicketCheckPage() {
  const [search, setSearch] = useSearchParams();
  const summary = useSummary();
  const latest = useLatestDates(summary.data);
  const tickets = useMyTickets();

  const game = gameFromParam(search.get('game')) as ToolGame;
  const paramDate = search.get('ngay') ?? '';
  const date = isValidDate(paramDate) ? paramDate : latest[game] ?? '';
  const initialText = parseTicketParam(search.get('ve'))
    .map((t) => (game === 'xsmb' ? t : t.replace(/-/g, ' ')))
    .join('\n');

  const [text, setText] = useState(initialText);
  const [submitted, setSubmitted] = useState<{ text: string; game: ToolGame; date: string } | null>(
    initialText ? { text: initialText, game, date } : null
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { lookup, error } = useDrawLookup(submitted ? [submitted.game] : []);

  const rows = useMemo<Row[] | null>(() => {
    if (!submitted || !submitted.date) return null;
    const draws = lookup[submitted.game];
    const draw = draws
      ? (draws as (XSMBHistoricalDraw | VietlottHistoricalDraw)[]).find((d) => d.date === submitted.date)
      : undefined;
    const outcomeFor = (numbers: string): TicketOutcome => {
      if (!isDrawDay(submitted.game, submitted.date)) return { kind: 'missing', reason: 'not_draw_day' };
      const last = latest[submitted.game];
      if (last && submitted.date > last) return { kind: 'waiting' };
      if (!draws) return { kind: 'loading' };
      if (!draw) return { kind: 'missing', reason: 'out_of_range' };
      return checkAgainstDraw(submitted.game, numbers, draw);
    };
    if (submitted.game === 'xsmb') {
      const parsed = parseXsmbTickets(submitted.text);
      return [
        ...parsed.tickets.map((t) => ({ input: t, numbers: t, outcome: outcomeFor(t) })),
        ...parsed.invalid.map((t) => ({ input: t, error: 'Không phải vé 5 chữ số' })),
      ];
    }
    return parseVietlottTickets(submitted.text, submitted.game).map((t) =>
      t.error
        ? { input: t.line, error: t.error }
        : { input: t.line, numbers: t.balls.map((b) => String(b).padStart(2, '0')).join('-'), outcome: outcomeFor(t.balls.join('-')) }
    );
  }, [submitted, lookup, latest]);

  const winCount = rows?.filter((r) => r.outcome && outcomeHasPrize(r.outcome)).length ?? 0;
  const validRows = rows?.filter((r) => r.numbers) ?? [];

  const update = (next: Partial<{ game: ToolGame; date: string }>) => {
    const q = new URLSearchParams(search);
    if (next.game) {
      q.set('game', GAME_PARAM[next.game]);
      q.delete('ngay');
      q.delete('ve');
      setText('');
      setSubmitted(null);
    }
    if (next.date !== undefined) {
      if (next.date) q.set('ngay', next.date);
      else q.delete('ngay');
    }
    setSearch(q, { replace: true });
  };

  const submit = () => {
    setSaveMessage(null);
    setSubmitted({ text, game, date });
    const list =
      game === 'xsmb'
        ? parseXsmbTickets(text).tickets
        : parseVietlottTickets(text, game)
            .filter((t) => !t.error)
            .map((t) => t.balls.map((b) => String(b).padStart(2, '0')).join('-'));
    const q = new URLSearchParams(search);
    q.set('game', GAME_PARAM[game]);
    if (date) q.set('ngay', date);
    if (list.length) q.set('ve', list.join('.'));
    else q.delete('ve');
    setSearch(q, { replace: true });
  };

  const saveAll = () => {
    if (!submitted) return;
    const created = validRows
      .map((r) => createTicket(submitted.game, r.numbers!.replace(/-/g, ' '), submitted.date))
      .filter((t): t is SavedTicket => !('error' in t));
    const r = addTickets(tickets.value, created);
    tickets.set(r.list);
    setSaveMessage(`Đã lưu ${r.added} vé vào "Vé của tôi"${r.duplicates ? `, ${r.duplicates} vé đã có sẵn` : ''}.`);
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}#${paths.check(
    submitted?.game ?? game,
    submitted?.date ?? date,
    validRows.map((r) => r.numbers!)
  )}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setSaveMessage('Đã sao chép liên kết. Liên kết chứa số vé, chỉ chia sẻ với người bạn tin tưởng.');
    } catch {
      setSaveMessage(shareUrl);
    }
  };

  const suggestedDate = date && !isDrawDay(game, date) ? previousDrawDate(game, date) : null;

  return (
    <ToolsLayout
      active="check"
      title="Dò vé"
      intro="Nhập một hoặc nhiều vé, chọn ngày quay và xem vé trúng giải nào theo cơ cấu giải. Việc dò vé chạy trên máy của bạn, không gửi số vé đi đâu."
    >
      <div className={styles.grid2}>
        <Card title="Nhập vé" icon={<Search size={16} />}>
          <div className={styles.stack}>
            <div className={styles.grid3}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="check-game">
                  Loại vé
                </label>
                <GameSelect id="check-game" value={game} onChange={(g) => update({ game: g })} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="check-date">
                  Ngày quay
                </label>
                <input
                  id="check-date"
                  type="date"
                  className={styles.input}
                  value={date}
                  max={latest[game]}
                  onChange={(e) => update({ date: e.target.value })}
                />
              </div>
            </div>
            {suggestedDate && (
              <div className={`${styles.notice} ${styles.noticeWarn}`}>
                Ngày {date} không có kỳ quay {game === 'xsmb' ? 'XSMB' : game === 'vietlott_655' ? 'Power 6/55' : 'Mega 6/45'}.{' '}
                <Button variant="link" onClick={() => update({ date: suggestedDate })}>
                  Chọn kỳ {suggestedDate}
                </Button>
              </div>
            )}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="check-tickets">
                Số vé
              </label>
              <textarea
                id="check-tickets"
                className={styles.textarea}
                value={text}
                placeholder={PLACEHOLDER[game]}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
                }}
              />
              <span className={styles.hint}>Tối đa 50 vé mỗi lần. Ctrl + Enter để dò.</span>
            </div>
            <div className={styles.row}>
              <Button variant="emerald" icon={<Search size={15} />} onClick={submit} disabled={!text.trim() || !date}>
                Dò vé
              </Button>
              <Link to={paths.myTickets()} className={styles.small}>
                Xem vé đã lưu
              </Link>
            </div>
            {game !== 'xsmb' && (
              <p className={styles.hint}>
                Xác suất một vé 6 số trúng Jackpot 1: {VIETLOTT_JACKPOT_ODDS[game]}. Dò vé không làm thay đổi xác suất này.
              </p>
            )}
          </div>
        </Card>

        <Card title={rows ? `Kết quả${submitted ? ` kỳ ${submitted.date}` : ''}` : 'Kết quả'}>
          {!rows ? (
            <p className={styles.small}>Nhập vé rồi bấm "Dò vé".</p>
          ) : (
            <div className={styles.stack} aria-live="polite">
              {error && <div className={`${styles.notice} ${styles.noticeDanger}`}>Không tải được kết quả kỳ quay. Kiểm tra kết nối mạng.</div>}
              {validRows.length > 0 && (
                <div className={styles.spread}>
                  <span className={styles.small} data-testid="check-summary">
                    {validRows.length} vé, {winCount} vé trúng giải
                  </span>
                  <div className={styles.row}>
                    <Button size="sm" icon={<Save size={14} />} onClick={saveAll}>
                      Lưu vào Vé của tôi
                    </Button>
                    <Button size="sm" variant="ghost" icon={<Link2 size={14} />} onClick={copyLink}>
                      Sao chép liên kết
                    </Button>
                  </div>
                </div>
              )}
              {saveMessage && (
                <div className={`${styles.notice} ${styles.noticeOk}`} role="status">
                  {saveMessage}
                </div>
              )}
              <ul className={styles.list}>
                {rows.map((r, i) => (
                  <li key={`${r.input}-${i}`} className={`${styles.item} ${r.outcome && outcomeHasPrize(r.outcome) ? styles.itemWin : ''}`}>
                    <div className={styles.itemTitle}>
                      Vé <span className={styles.mono}>{r.numbers ?? r.input}</span>
                    </div>
                    {r.error ? (
                      <span className={`${styles.chip} ${styles.chipWarn}`}>{r.error}</span>
                    ) : (
                      <OutcomeView outcome={r.outcome!} numbers={r.numbers!} />
                    )}
                  </li>
                ))}
              </ul>
              <OfficialResultsLink sources={submitted?.game === 'xsmb' ? ['xsktThuDo'] : ['vietlott']} />
            </div>
          )}
        </Card>
      </div>
    </ToolsLayout>
  );
}
