import React from 'react';
import { Dice5, Copy, Check, RefreshCw, Lock, Unlock, Layers } from 'lucide-react';
import { Ball, Button } from '../../ui';
import { POPULAR_PATTERN_LABELS } from '../../utils/quickPick';
import { AvoidSharingNote } from './AvoidSharingNote';
import type { VietlottProductHubModel } from './useVietlottHub';
import styles from './QuickPickPanel.module.css';

export const QuickPickPanel: React.FC<{ model: VietlottProductHubModel }> = ({ model }) => {
  const {
    pinnedNumbers, excludedNumbers, handleToggleExcluded, sumFilterOn, setSumFilterOn, sumRange, setSumRange,
    evenCount, setEvenCount, avoidPopular, setAvoidPopular, pickOptionsError, quickPickError, generatedPatterns,
    generatedNumbers, quickPickCopied, is655, maxNumber, gameName, handleGenerateNumbers, handleTogglePin,
    handleCopyQuickPick, handleTransferToComboBao,
  } = model;
  const expectedSum = 3 * (maxNumber + 1);
  const setSumBound = (idx: 0 | 1, value: string) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return;
    setSumRange(idx === 0 ? [n, sumRange[1]] : [sumRange[0], n]);
  };

  return (
    <div className={`glass-card animate-fade-in ${styles.panel}`}>
      <div>
        <h3 className={styles.title}>
          <Dice5 size={20} color="var(--accent-gold)" />
          <span>Chọn Số Ngẫu Nhiên ({gameName})</span>
        </h3>
        <p className={styles.lead}>
          Máy chọn ngẫu nhiên 6 số trong 1-{maxNumber}. Bạn có thể ghim số, loại số không thích, giới hạn tổng hoặc số lượng số chẵn. Các
          tùy chọn chỉ giới hạn bộ số được chọn; trong giới hạn đó mọi bộ số có cùng khả năng được chọn.
        </p>
        <p className={styles.odds}>
          Bộ số ngẫu nhiên, <strong>không làm tăng xác suất trúng</strong>. Xác suất trúng Jackpot{is655 ? ' 1' : ''} của mọi bộ 6 số:{' '}
          <strong>{is655 ? '1/28.989.675' : '1/8.145.060'}</strong>.
        </p>
      </div>

      <div className={styles.options}>
        <div className={styles.option}>
          <label className={styles.optionHead}>
            <input type="checkbox" checked={sumFilterOn} onChange={(e) => setSumFilterOn(e.target.checked)} />
            Giới hạn tổng 6 số
          </label>
          <div className={styles.row}>
            <span>Từ</span>
            <input className={styles.input} type="number" aria-label="Tổng nhỏ nhất" value={sumRange[0]} disabled={!sumFilterOn} onChange={(e) => setSumBound(0, e.target.value)} />
            <span>đến</span>
            <input className={styles.input} type="number" aria-label="Tổng lớn nhất" value={sumRange[1]} disabled={!sumFilterOn} onChange={(e) => setSumBound(1, e.target.value)} />
          </div>
          <span className={styles.hint}>Tổng trung bình của 6 số ngẫu nhiên là {expectedSum}.</span>
        </div>

        <div className={styles.option}>
          <label className={styles.optionHead} htmlFor="qp-even">Số lượng số chẵn</label>
          <select
            id="qp-even"
            className={styles.select}
            value={evenCount ?? ''}
            onChange={(e) => setEvenCount(e.target.value === '' ? null : parseInt(e.target.value, 10))}
          >
            <option value="">Không giới hạn</option>
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} chẵn - {6 - n} lẻ</option>
            ))}
          </select>
        </div>

        <div className={styles.option}>
          <label className={styles.optionHead}>
            <input type="checkbox" checked={avoidPopular} onChange={(e) => setAvoidPopular(e.target.checked)} />
            Tránh bộ số phổ biến
          </label>
          <span className={styles.hint}>
            Bỏ qua các bộ toàn số 1-31, có 3 số liên tiếp, cách đều, dồn một hàng chục... Không đổi xác suất trúng, chỉ giảm khả năng phải chia
            Jackpot (xem giải thích bên dưới).
          </span>
        </div>
      </div>

      <details className={styles.option}>
        <summary className={styles.optionHead}>Loại số không thích ({excludedNumbers.length} số)</summary>
        <div className={styles.excludeGrid}>
          {Array.from({ length: maxNumber }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" className={styles.excludeBtn} aria-pressed={excludedNumbers.includes(n)} onClick={() => handleToggleExcluded(n)}>
              {String(n).padStart(2, '0')}
            </button>
          ))}
        </div>
      </details>

      <div className={styles.result}>
        {generatedNumbers.length === 0 ? (
          <div className={styles.empty}>
            <Dice5 size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p>Nhấn "Chọn ngẫu nhiên" để máy chọn một bộ số.</p>
          </div>
        ) : (
          <div className={styles.balls}>
            {generatedNumbers.map((num) => {
              const isPinned = pinnedNumbers.includes(num);
              return (
                <div key={num} className={styles.ballCol}>
                  <Ball value={num} size="lg" className={isPinned ? styles.pinned : undefined} onClick={() => handleTogglePin(num)} title={isPinned ? `Bỏ ghim số ${num}` : `Ghim số ${num}`} />
                  <button type="button" className={isPinned ? `${styles.pinBtn} ${styles.pinBtnOn}` : styles.pinBtn} onClick={() => handleTogglePin(num)}>
                    {isPinned ? <Lock size={11} /> : <Unlock size={11} />}
                    <span>{isPinned ? 'Đã ghim' : 'Ghim'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {generatedNumbers.length === 6 && (
          <div className={styles.meta}>
            <span>Tổng: <strong>{generatedNumbers.reduce((a, b) => a + b, 0)}</strong></span>
            <span>•</span>
            <span>
              <strong>{generatedNumbers.filter((n) => n % 2 === 0).length} chẵn - {generatedNumbers.filter((n) => n % 2 !== 0).length} lẻ</strong>
            </span>
          </div>
        )}

        {generatedNumbers.length === 6 && generatedPatterns.length > 0 && (
          <div className={styles.patternWarn} role="note">
            Bộ số này có mẫu nhiều người hay chọn. Xác suất trúng không đổi, nhưng nếu trúng thì khả năng phải chia Jackpot cao hơn:
            <ul>
              {generatedPatterns.map((p) => (
                <li key={p}>{POPULAR_PATTERN_LABELS[p]}</li>
              ))}
            </ul>
          </div>
        )}

        {(pickOptionsError || quickPickError) && (
          <p className={styles.error} role="alert">{pickOptionsError ?? quickPickError}</p>
        )}

        <div className={styles.actions}>
          <Button variant="gradient" pill size="lg" icon={<RefreshCw size={17} />} onClick={handleGenerateNumbers} disabled={Boolean(pickOptionsError)}>
            {generatedNumbers.length === 0 ? 'Chọn ngẫu nhiên' : 'Chọn bộ khác'}
          </Button>
          {generatedNumbers.length === 6 && (
            <>
              <Button pill icon={quickPickCopied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />} onClick={handleCopyQuickPick}>
                {quickPickCopied ? 'Đã sao chép!' : 'Sao chép'}
              </Button>
              <Button variant="emerald" pill icon={<Layers size={16} />} onClick={() => handleTransferToComboBao(generatedNumbers)}>
                Xem lịch sử bộ số này
              </Button>
            </>
          )}
        </div>
      </div>

      <AvoidSharingNote className={styles.sharing} />
    </div>
  );
};
