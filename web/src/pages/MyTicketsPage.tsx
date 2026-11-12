import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Plus, Send, Trash2, Upload } from 'lucide-react';
import { Button, Card } from '../ui';
import { ToolGame } from '../app/routes';
import { GameSelect, ToolsLayout } from '../features/tools/ToolsLayout';
import { evaluateSavedTicket, outcomeHasPrize } from '../features/tickets/evaluate';
import { OutcomeView } from '../features/tickets/OutcomeView';
import { useDrawLookup } from '../features/tickets/useDrawLookup';
import { useLatestDates, useMyTickets } from '../features/tickets/useMyTickets';
import { clearLocalStore, MY_TICKETS_KEY } from '../data/useLocalStore';
import { formatVnDate, nextDrawTime, vnDateString } from '../utils/drawSchedule';
import {
  addTickets,
  createTicket,
  exportTickets,
  importTickets,
  markSeen,
  removeTicket,
  telegramCommand,
  TICKET_GAME_LABEL,
  ticketStatus,
} from '../utils/myTickets';
import { useSummary } from './useSummary';
import styles from '../features/tools/tools.module.css';

/** "Vé của tôi": lưu vé trên máy, tự dò khi có kết quả. URL: /ve-cua-toi */
export default function MyTicketsPage() {
  const summary = useSummary();
  const latest = useLatestDates(summary.data);
  const store = useMyTickets();
  const tickets = store.value;

  const [game, setGame] = useState<ToolGame>('xsmb');
  const [numbers, setNumbers] = useState('');
  const [label, setLabel] = useState('');
  const [date, setDate] = useState(() => vnDateString(nextDrawTime('xsmb')));
  const [message, setMessage] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const readyGames = useMemo(
    () => new Set(tickets.filter((t) => ticketStatus(t, latest) === 'ready').map((t) => t.game)),
    [tickets, latest]
  );
  const { lookup, error } = useDrawLookup(readyGames);
  const outcomes = useMemo(() => new Map(tickets.map((t) => [t.id, evaluateSavedTicket(t, latest, lookup)])), [tickets, latest, lookup]);

  // Đánh dấu các vé đã có kết quả là "đã xem" để không nhắc lại ở các trang khác
  const unseenReady = tickets.filter((t) => !t.seenAt && outcomes.get(t.id)?.kind !== 'loading' && ticketStatus(t, latest) === 'ready');
  const unseenKey = unseenReady.map((t) => t.id).join(',');
  useEffect(() => {
    if (unseenKey) store.set((prev) => markSeen(prev, unseenKey.split(',')));
    // store.set ổn định theo key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unseenKey]);

  const changeGame = (g: ToolGame) => {
    setGame(g);
    setDate(vnDateString(nextDrawTime(g)));
  };

  const add = () => {
    const t = createTicket(game, numbers, date, label);
    if ('error' in t) {
      setMessage({ tone: 'warn', text: t.error });
      return;
    }
    const r = addTickets(tickets, [t]);
    store.set(r.list);
    setMessage(r.added ? { tone: 'ok', text: 'Đã lưu vé.' } : { tone: 'warn', text: 'Vé này đã có trong danh sách.' });
    if (r.added) {
      setNumbers('');
      setLabel('');
    }
  };

  const download = () => {
    const blob = new Blob([exportTickets(tickets)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ve-cua-toi-${vnDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const r = importTickets(await file.text(), tickets);
    if (r.error) {
      setMessage({ tone: 'warn', text: r.error });
    } else {
      store.set(r.list);
      setMessage({
        tone: 'ok',
        text: `Đã nhập ${r.added} vé${r.duplicates ? `, bỏ qua ${r.duplicates} vé trùng hoặc vượt giới hạn` : ''}${r.invalid ? `, ${r.invalid} vé không hợp lệ` : ''}.`,
      });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const copyBotCommand = async () => {
    const cmd = telegramCommand(tickets.slice(0, 20));
    try {
      await navigator.clipboard.writeText(cmd);
      setMessage({ tone: 'ok', text: 'Đã sao chép lệnh /dove (tối đa 20 vé). Dán vào cuộc trò chuyện với bot Telegram để dò.' });
    } catch {
      setMessage({ tone: 'ok', text: cmd });
    }
  };

  const clearAll = () => {
    if (!window.confirm('Xóa toàn bộ vé đã lưu trên máy này? Nên xuất file JSON trước nếu muốn giữ lại.')) return;
    clearLocalStore(MY_TICKETS_KEY);
    setMessage({ tone: 'ok', text: 'Đã xóa toàn bộ vé trên máy này.' });
  };

  const sorted = useMemo(() => [...tickets].sort((a, b) => b.drawDate.localeCompare(a.drawDate)), [tickets]);
  const ready = sorted.filter((t) => ticketStatus(t, latest) === 'ready');
  const waiting = sorted.filter((t) => ticketStatus(t, latest) === 'waiting');
  const wins = ready.filter((t) => {
    const o = outcomes.get(t.id);
    return o && outcomeHasPrize(o);
  }).length;

  const renderTicket = (t: (typeof tickets)[number]) => {
    const o = outcomes.get(t.id)!;
    return (
      <li key={t.id} className={`${styles.item} ${outcomeHasPrize(o) ? styles.itemWin : ''}`} data-testid="saved-ticket">
        <div className={styles.spread}>
          <div className={styles.itemTitle}>
            {TICKET_GAME_LABEL[t.game]} <span className={styles.mono}>{t.numbers}</span>
            {t.label && <span className={styles.small}> · {t.label}</span>}
          </div>
          <Button size="sm" variant="ghost" icon={<Trash2 size={13} />} aria-label={`Xóa vé ${t.numbers}`} onClick={() => store.set(removeTicket(tickets, t.id))}>
            Xóa
          </Button>
        </div>
        <div className={styles.small}>Kỳ quay: {formatVnDate(t.drawDate)}</div>
        <OutcomeView outcome={o} numbers={t.numbers} />
      </li>
    );
  };

  return (
    <ToolsLayout
      active="my_tickets"
      title="Vé của tôi"
      intro="Lưu vé đã mua để tự dò khi có kết quả. Vé chỉ lưu trong trình duyệt trên máy này (localStorage), không cần tài khoản và không gửi đi đâu. Xuất file JSON để sao lưu hoặc chuyển sang máy khác."
    >
      {!store.persistent && (
        <div className={`${styles.notice} ${styles.noticeWarn}`}>
          Trình duyệt đang chặn lưu dữ liệu (ví dụ chế độ ẩn danh). Vé chỉ giữ đến khi đóng trang; hãy xuất file JSON để giữ lại.
        </div>
      )}
      <div className={styles.grid2}>
        <Card title="Thêm vé" icon={<Plus size={16} />}>
          <div className={styles.stack}>
            <div className={styles.grid3}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="mt-game">
                  Loại vé
                </label>
                <GameSelect id="mt-game" value={game} onChange={changeGame} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="mt-date">
                  Ngày quay
                </label>
                <input id="mt-date" type="date" className={styles.input} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="mt-numbers">
                Số trên vé
              </label>
              <input
                id="mt-numbers"
                className={`${styles.input} ${styles.mono}`}
                inputMode="numeric"
                placeholder={game === 'xsmb' ? 'Ví dụ: 74129' : 'Ví dụ: 01 02 21 38 39 51'}
                value={numbers}
                onChange={(e) => setNumbers(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="mt-label">
                Ghi chú (không bắt buộc)
              </label>
              <input id="mt-label" className={styles.input} maxLength={40} value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className={styles.row}>
              <Button variant="emerald" icon={<Plus size={15} />} onClick={add} disabled={!numbers.trim() || !date}>
                Lưu vé
              </Button>
            </div>
            {message && (
              <div className={`${styles.notice} ${message.tone === 'ok' ? styles.noticeOk : styles.noticeWarn}`} role="status">
                {message.text}
              </div>
            )}
          </div>
        </Card>

        <Card title="Sao lưu & Telegram">
          <div className={styles.stack}>
            <div className={styles.row}>
              <Button icon={<Download size={15} />} onClick={download} disabled={!tickets.length}>
                Xuất file JSON
              </Button>
              <Button icon={<Upload size={15} />} onClick={() => fileRef.current?.click()}>
                Nhập file JSON
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className={styles.fileInput}
                aria-label="Chọn file JSON vé"
                data-testid="import-file"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </div>
            <div className={styles.row}>
              <Button icon={<Send size={15} />} onClick={copyBotCommand} disabled={!tickets.length}>
                Sao chép lệnh dò cho Telegram bot
              </Button>
            </div>
            <p className={styles.hint}>
              Bot không lưu vé của bạn: lệnh <code>/dove</code> chứa sẵn số vé và ngày quay, bot chỉ đối chiếu rồi trả lời.
            </p>
            <div className={styles.row}>
              <Button variant="ghost" icon={<Trash2 size={15} />} onClick={clearAll} disabled={!tickets.length}>
                Xóa toàn bộ vé trên máy này
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card title={`Vé đã có kết quả (${ready.length})`} actions={ready.length ? <span className={styles.small}>{wins} vé trúng giải</span> : undefined}>
        {error && <div className={`${styles.notice} ${styles.noticeDanger}`}>Không tải được kết quả kỳ quay. Kiểm tra kết nối mạng.</div>}
        {ready.length ? <ul className={styles.list}>{ready.map(renderTicket)}</ul> : <p className={styles.small}>Chưa có vé nào đã có kết quả.</p>}
      </Card>

      <Card title={`Vé chờ kết quả (${waiting.length})`}>
        {waiting.length ? (
          <ul className={styles.list}>{waiting.map(renderTicket)}</ul>
        ) : (
          <p className={styles.small}>Không có vé nào đang chờ. Vé sẽ được dò tự động khi trang có kết quả kỳ quay của vé.</p>
        )}
      </Card>
    </ToolsLayout>
  );
}
