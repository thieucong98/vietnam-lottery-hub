import React, { useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink, HeartHandshake, Plus, Trash2, Wallet } from 'lucide-react';
import { Button, Card, Table } from '../ui';
import { ToolsLayout } from '../features/tools/ToolsLayout';
import { BUDGET_KEY, clearLocalStore, useLocalStore } from '../data/useLocalStore';
import {
  addEntry,
  BudgetLevel,
  levelAfterAdding,
  monthKey,
  monthlyTotals,
  parseAmount,
  removeEntry,
  sanitizeBudget,
  setMonthlyLimit,
  summarizeMonth,
} from '../utils/budget';
import { vnDateString } from '../utils/drawSchedule';
import { formatVND } from '../utils/lotteryUtils';
import styles from '../features/tools/tools.module.css';

const LEVEL_TEXT: Record<BudgetLevel, string> = {
  none: 'Chưa đặt ngân sách tháng.',
  ok: 'Trong ngân sách.',
  warning: 'Đã dùng từ 80% ngân sách tháng. Cân nhắc dừng lại đến tháng sau.',
  reached: 'Đã dùng hết ngân sách tháng. Dừng chơi đến tháng sau.',
  exceeded: 'Đã vượt ngân sách tháng. Dừng chơi và đừng cố gỡ lại số tiền đã chi.',
};

// Liên kết hỗ trợ: chỉ đưa nguồn đã kiểm tra truy cập được; không có liên kết thương mại
const SUPPORT_LINKS = [
  { href: 'https://www.gamblersanonymous.org/', label: 'Gamblers Anonymous: nhóm tự lực, có họp trực tuyến (tiếng Anh)' },
  { href: 'https://www.begambleaware.org/', label: 'BeGambleAware: tự đánh giá thói quen chơi và tài liệu hỗ trợ (tiếng Anh)' },
];

const WARNING_SIGNS = [
  'Chi nhiều hơn số tiền đã định, hoặc vay mượn để mua vé.',
  'Mua thêm để "gỡ" số tiền đã mất.',
  'Giấu người thân về số tiền đã chi.',
  'Thấy bứt rứt, cáu gắt khi cố bớt chơi.',
  'Chơi ảnh hưởng tới công việc, học tập, gia đình.',
];

const monthLabel = (m: string) => `Tháng ${m.slice(5)}/${m.slice(0, 4)}`;

/** Công cụ chơi có trách nhiệm: ngân sách tháng, sổ chi tiêu (lưu trên máy), cảnh báo, liên kết hỗ trợ. URL: /choi-co-trach-nhiem */
export default function BudgetPage() {
  const store = useLocalStore(BUDGET_KEY, sanitizeBudget);
  const state = store.value;
  const today = vnDateString();
  const month = monthKey(today);
  const summary = summarizeMonth(state, month);
  const history = useMemo(() => monthlyTotals(state, month, 6), [state, month]);

  const [limitText, setLimitText] = useState(state.monthlyLimit ? String(state.monthlyLimit) : '');
  const [amountText, setAmountText] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pendingAmount = parseAmount(amountText);
  const pendingLevel = pendingAmount ? levelAfterAdding(state, date, pendingAmount) : null;

  const saveLimit = () => {
    if (!limitText.trim()) {
      store.set(setMonthlyLimit(state, null));
      setError(null);
      return;
    }
    const v = parseAmount(limitText);
    if (!v) {
      setError('Ngân sách không hợp lệ. Nhập số tiền, ví dụ 200000 hoặc 200.000');
      return;
    }
    setError(null);
    store.set(setMonthlyLimit(state, v));
  };

  const addSpend = () => {
    if (!pendingAmount) {
      setError('Số tiền không hợp lệ.');
      return;
    }
    try {
      store.set(addEntry(state, { date, amount: pendingAmount, note }));
      setAmountText('');
      setNote('');
      setError(null);
    } catch {
      setError('Ngày không hợp lệ.');
    }
  };

  const clearAll = () => {
    if (!window.confirm('Xóa ngân sách và toàn bộ sổ chi tiêu trên máy này?')) return;
    clearLocalStore(BUDGET_KEY);
    setLimitText('');
  };

  const ratioPct = summary.ratio === null ? 0 : Math.min(100, summary.ratio * 100);
  const barClass =
    summary.level === 'exceeded' || summary.level === 'reached'
      ? styles.progressDanger
      : summary.level === 'warning'
        ? styles.progressWarn
        : '';
  const levelNotice =
    summary.level === 'exceeded' || summary.level === 'reached'
      ? styles.noticeDanger
      : summary.level === 'warning'
        ? styles.noticeWarn
        : styles.noticeOk;

  return (
    <ToolsLayout
      active="budget"
      title="Chơi có trách nhiệm"
      intro="Tự đặt ngân sách mỗi tháng và ghi lại tiền mua vé. Dữ liệu chỉ lưu trong trình duyệt trên máy này, không gửi đi đâu. Xổ số là trò chơi giải trí: giá trị kỳ vọng của mỗi vé luôn thấp hơn giá vé, nên chỉ dùng số tiền bạn chấp nhận mất."
    >
      {!store.persistent && (
        <div className={`${styles.notice} ${styles.noticeWarn}`}>Trình duyệt đang chặn lưu dữ liệu; sổ chi tiêu chỉ giữ đến khi đóng trang.</div>
      )}

      <div className={styles.grid2}>
        <Card title={monthLabel(month)} icon={<Wallet size={16} />}>
          <div className={styles.stack} data-testid="budget-summary">
            <div className={styles.grid3}>
              <div>
                <div className={styles.statLabel}>Đã chi</div>
                <div className={styles.statValue}>{formatVND(summary.spent)}</div>
              </div>
              <div>
                <div className={styles.statLabel}>Ngân sách</div>
                <div className={styles.statValue}>{summary.limit ? formatVND(summary.limit) : '-'}</div>
              </div>
              <div>
                <div className={styles.statLabel}>Còn lại</div>
                <div className={styles.statValue}>{summary.remaining !== null ? formatVND(Math.max(0, summary.remaining)) : '-'}</div>
              </div>
            </div>
            {summary.limit && (
              <div
                className={styles.progress}
                role="progressbar"
                aria-label="Mức dùng ngân sách tháng"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(ratioPct)}
              >
                <div className={`${styles.progressBar} ${barClass}`} style={{ width: `${ratioPct}%` }} />
              </div>
            )}
            <div className={`${styles.notice} ${levelNotice}`} role={summary.level === 'ok' || summary.level === 'none' ? undefined : 'alert'}>
              {LEVEL_TEXT[summary.level]}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="budget-limit">
                Ngân sách mỗi tháng (đồng)
              </label>
              <div className={styles.row}>
                <input
                  id="budget-limit"
                  className={`${styles.input} ${styles.mono}`}
                  inputMode="numeric"
                  placeholder="Ví dụ: 200.000"
                  value={limitText}
                  onChange={(e) => setLimitText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveLimit()}
                />
                <Button onClick={saveLimit}>Lưu ngân sách</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Ghi khoản chi" icon={<Plus size={16} />}>
          <div className={styles.stack}>
            <div className={styles.grid3}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="spend-amount">
                  Số tiền (đồng)
                </label>
                <input
                  id="spend-amount"
                  className={`${styles.input} ${styles.mono}`}
                  inputMode="numeric"
                  placeholder="10.000"
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSpend()}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="spend-date">
                  Ngày
                </label>
                <input id="spend-date" type="date" className={styles.input} value={date} max={today} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="spend-note">
                Ghi chú (không bắt buộc)
              </label>
              <input id="spend-note" className={styles.input} maxLength={80} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {pendingLevel && (pendingLevel === 'exceeded' || pendingLevel === 'reached') && (
              <div className={`${styles.notice} ${styles.noticeDanger}`} role="alert">
                <AlertTriangle size={14} /> Khoản này sẽ làm {pendingLevel === 'exceeded' ? 'vượt' : 'hết'} ngân sách tháng. Bạn có chắc muốn chi thêm?
              </div>
            )}
            <div className={styles.row}>
              <Button variant="emerald" icon={<Plus size={15} />} onClick={addSpend} disabled={!amountText.trim()}>
                Ghi khoản chi
              </Button>
            </div>
            {error && (
              <div className={`${styles.notice} ${styles.noticeWarn}`} role="status">
                {error}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className={styles.grid2}>
        <Card title={`Khoản chi ${monthLabel(month).toLowerCase()}`}>
          <Table
            caption="Khoản chi trong tháng"
            maxHeight={300}
            emptyText="Chưa ghi khoản chi nào trong tháng."
            rows={summary.entries}
            rowKey={(e) => e.id}
            columns={[
              { key: 'date', header: 'Ngày', mono: true, render: (e) => e.date },
              { key: 'amount', header: 'Số tiền', align: 'right', render: (e) => formatVND(e.amount) },
              { key: 'note', header: 'Ghi chú', render: (e) => e.note ?? '' },
              {
                key: 'del',
                header: <span className="sr-only">Xóa</span>,
                align: 'right',
                render: (e) => (
                  <Button size="sm" variant="ghost" aria-label={`Xóa khoản ${e.date}`} onClick={() => store.set(removeEntry(state, e.id))}>
                    <Trash2 size={13} />
                  </Button>
                ),
              },
            ]}
          />
        </Card>
        <Card title="6 tháng gần nhất">
          <Table
            caption="Tổng chi 6 tháng gần nhất"
            rows={history}
            rowKey={(r) => r.month}
            columns={[
              { key: 'm', header: 'Tháng', render: (r) => monthLabel(r.month) },
              { key: 's', header: 'Đã chi', align: 'right', render: (r) => formatVND(r.spent) },
              {
                key: 'v',
                header: 'So với ngân sách',
                align: 'right',
                render: (r) => (state.monthlyLimit ? `${Math.round((r.spent / state.monthlyLimit) * 100)}%` : '-'),
              },
            ]}
          />
          <div className={styles.row}>
            <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={clearAll}>
              Xóa dữ liệu ngân sách trên máy này
            </Button>
          </div>
        </Card>
      </div>

      <Card title="Dấu hiệu cần dừng lại & nơi hỗ trợ" icon={<HeartHandshake size={16} />}>
        <div className={styles.grid2}>
          <div className={styles.stack}>
            <ul className={styles.tierList}>
              {WARNING_SIGNS.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
            <p className={styles.small}>
              Nếu thấy mình có một trong các dấu hiệu trên, hãy nói chuyện với người thân, hoặc tìm bác sĩ tâm thần, chuyên gia tâm lý tại bệnh
              viện gần nhất. Trường hợp khẩn cấp, gọi <strong>115</strong>.
            </p>
          </div>
          <div className={styles.links}>
            {SUPPORT_LINKS.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label} <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>
      </Card>
    </ToolsLayout>
  );
}
