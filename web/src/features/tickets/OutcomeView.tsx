import React from 'react';
import { Ball } from '../../ui';
import { formatVND } from '../../utils/lotteryUtils';
import { TIER_LABELS, TIER_ORDER, ticketKindLabel } from '../../utils/vietlottTicket';
import { XSMB_TIERS, XSMB_SPECIAL_SUB_VALUE } from '../../utils/xsmbTicket';
import { VIETLOTT_PRIZE_VALUES } from '../../utils/ticketCheck';
import type { TicketOutcome } from './evaluate';
import styles from '../tools/tools.module.css';

/** Kết quả dò một vé theo cơ cấu giải */
export const OutcomeView: React.FC<{ outcome: TicketOutcome; numbers: string }> = ({ outcome, numbers }) => {
  if (outcome.kind === 'waiting') return <span className={`${styles.chip} ${styles.chipWait}`}>Chờ kết quả kỳ quay</span>;
  if (outcome.kind === 'loading') return <span className={styles.small}>Đang tải kết quả kỳ quay...</span>;
  if (outcome.kind === 'missing') {
    return (
      <span className={`${styles.chip} ${styles.chipWarn}`}>
        {outcome.reason === 'not_draw_day' ? 'Ngày này không có kỳ quay' : 'Không có kết quả kỳ này trong dữ liệu (365 kỳ XSMB gần nhất)'}
      </span>
    );
  }

  if (outcome.kind === 'xsmb') {
    const { wins, minTotal } = outcome.result;
    if (!wins.length) return <span className={styles.small}>Không trúng giải kỳ {outcome.draw.date}.</span>;
    return (
      <div className={styles.stack}>
        <div className={styles.tierList}>
          {wins.map((w, i) => (
            <div key={`${w.tier}-${i}`} className={styles.tierRow}>
              <span>
                {w.label} <span className={styles.mono}>({w.winningNumber})</span>
              </span>
              <strong className={styles.mono}>{w.needsSeriesCheck ? `từ ${formatVND(w.value)}` : formatVND(w.value)}</strong>
            </div>
          ))}
        </div>
        {wins.some((w) => w.needsSeriesCheck) && (
          <div className={`${styles.notice} ${styles.noticeWarn}`}>
            Vé trùng 5 số của Giải Đặc Biệt. Nếu ký hiệu vé trùng ký hiệu trúng thưởng thì là Giải Đặc Biệt (
            {formatVND(XSMB_TIERS[0].value)}), nếu không là giải phụ Đặc Biệt ({formatVND(XSMB_SPECIAL_SUB_VALUE)}). Đối chiếu ký hiệu in trên vé
            với kết quả chính thức.
          </div>
        )}
        <div className={styles.small}>
          Tổng giá trị tham khảo: <strong>{formatVND(minTotal)}</strong> trở lên, chưa trừ thuế thu nhập cá nhân (giải từ 10 triệu đồng).
        </div>
      </div>
    );
  }

  const { result, draw, game } = outcome;
  const main = new Set(draw.balls);
  const tiers = TIER_ORDER.filter((t) => result.counts[t] > 0);
  return (
    <div className={styles.stack}>
      <div className={styles.balls} aria-label={`Vé ${numbers}`}>
        {result.balls.map((b) => (
          <Ball
            key={b}
            value={b}
            size="sm"
            tone={main.has(b) ? 'flat-gold' : b === draw.special && game === 'vietlott_655' ? 'flat-special-hit' : 'flat-muted'}
            title={main.has(b) ? `Số ${b} trùng kết quả` : undefined}
          />
        ))}
        <span className={styles.small}>
          {ticketKindLabel(result.balls.length)}
          {result.subTickets > 1 ? ` (${result.subTickets} vé con, ${formatVND(result.cost)})` : ''}
        </span>
      </div>
      <div className={styles.small}>
        Trùng {result.matchedMain.length} số chính{result.matchedSpecial ? ' và bóng đặc biệt' : ''} của kỳ #{draw.id} ({draw.date}).
      </div>
      {tiers.length === 0 ? (
        <span className={styles.small}>Không trúng giải.</span>
      ) : (
        <div className={styles.tierList}>
          {tiers.map((t) => (
            <div key={t} className={styles.tierRow}>
              <span>
                {TIER_LABELS[t]} × {result.counts[t]}
              </span>
              <strong className={styles.mono}>{t.startsWith('jackpot') ? 'Giá trị Jackpot của kỳ' : formatVND(VIETLOTT_PRIZE_VALUES[game][t] * result.counts[t])}</strong>
            </div>
          ))}
          {result.jackpotWins > 0 && (
            <div className={`${styles.notice} ${styles.noticeWarn}`}>
              Giá trị Jackpot thay đổi theo kỳ và được chia đều nếu có nhiều vé trúng. Đối chiếu với kết quả chính thức trên vietlott.vn.
            </div>
          )}
          {result.fixedPrizeTotal > 0 && (
            <div className={styles.small}>
              Tổng giải cố định: <strong>{formatVND(result.fixedPrizeTotal)}</strong>, chưa trừ thuế.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

