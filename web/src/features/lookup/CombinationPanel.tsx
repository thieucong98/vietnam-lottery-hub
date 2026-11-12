import React from 'react';
import { RefreshCw, Award } from 'lucide-react';
import type { InstantLookupModalModel } from './useInstantLookup';
import styles from './CombinationPanel.module.css';

export const CombinationPanel: React.FC<{ model: InstantLookupModalModel }> = ({ model }) => {
  const { cooccurrenceData, selectedGame, setSelectedGame, comboBalls, setComboBalls, comboInputText, setComboInputText, minMatchFilter, setMinMatchFilter, showBallPickerGrid, setShowBallPickerGrid, maxNumber, handleToggleComboBall, handleApplyComboInput, handleRandomCombo, comboEvaluationResults } = model;
  return (
        <div className={styles.colGap20}>
          {/* Chọn trò chơi Vietlott */}
          <div className={styles.rowGap10}>
            <button
              className={`tab-btn ${selectedGame === 'vietlott_655' ? 'active' : ''} ${styles.flex1MinW160JustifyCenter}`}
              onClick={() => setSelectedGame('vietlott_655')}
            >
              Vietlott Power 6/55
            </button>
            <button
              className={`tab-btn ${selectedGame === 'vietlott_645' ? 'active' : ''} ${styles.flex1MinW160JustifyCenter}`}
              onClick={() => setSelectedGame('vietlott_645')}
            >
              Vietlott Mega 6/45
            </button>
          </div>

          {/* Hộp chọn bóng & nhập nhanh */}
          <div className={styles.colBgTintPad18}
          >
            <div className={styles.rowJustifyBetweenCenter2}>
              <div>
                <h3 className={styles.text1Weight800White}>
                  Bộ Số Đang Chọn: {comboBalls.length} Số{' '}
                  <span className={styles.text08Gold}>
                    {comboBalls.length === 6
                      ? '(Vé đơn 6 số chuẩn)'
                      : comboBalls.length > 6
                      ? `(Vé Bao ${comboBalls.length})`
                      : `(Tổ hợp ${comboBalls.length} số)`}
                  </span>
                </h3>
                <p className={styles.text08Muted}>
                  Chọn từ 2 đến 18 số để kiểm tra xem đã từng trúng Jackpot 1, Jackpot 2, Giải Nhất/Nhì/Ba nào trong lịch sử 1.400+ kỳ quay!
                </p>
              </div>

              {/* Các nút preset */}
              <div className={styles.rowCenterGap8}>
                <button className={styles.rowPad5x12RoundSm}
                  onClick={handleRandomCombo}
                >
                  <RefreshCw size={12} />
                  Random 6 số
                </button>

                {cooccurrenceData && (
                  <button className={styles.pad5x12RoundSmBgTint2}
                    onClick={() => {
                      const topP = cooccurrenceData[selectedGame as 'vietlott_655' | 'vietlott_645']?.top_pairs?.[0];
                      if (topP) {
                        const nums = topP.numbers.map((n) => parseInt(n, 10));
                        setComboBalls(nums);
                        setComboInputText(nums.map((n) => n.toString().padStart(2, '0')).join(', '));
                      }
                    }}
                  >
                    Nạp Cặp Hot #1
                  </button>
                )}

                <button className={styles.pad5x12RoundSmBgTint}
                  onClick={() => setShowBallPickerGrid((prev) => !prev)}
                >
                  {showBallPickerGrid ? 'Thu gọn bàn bóng' : 'Mở bàn bóng'}
                </button>
              </div>
            </div>

            {/* Các bóng đang chọn hiển thị to rõ */}
            <div className={styles.rowCenterGap8}>
              {comboBalls.map((b) => (
                <div className={styles.inlineRowCenterJustifyCenter}
                  key={b}
                  onClick={() => handleToggleComboBall(b)}
                  title="Click để bỏ bóng này"
                >
                  {b.toString().padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* Ô nhập thủ công bằng chuỗi */}
            <div className={styles.rowGap8Center}>
              <input className={styles.flex1Pad8x12RoundSm}
                type="text"
                value={comboInputText}
                onChange={(e) => setComboInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyComboInput();
                }}
                placeholder="Nhập hoặc dán danh sách số (cách nhau bởi dấu phẩy hoặc khoảng trắng)..."
              />
              <button className={styles.pad8x16RoundSmBgGold}
                onClick={handleApplyComboInput}
              >
                Áp Dụng
              </button>
            </div>

            {/* Bàn chọn bóng thu nhỏ (Ball Picker Grid) */}
            {showBallPickerGrid && (
              <div className={styles.gridColsAutoGap6}
              >
                {Array.from({ length: maxNumber }, (_, i) => i + 1).map((n) => {
                  const isSelected = comboBalls.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => handleToggleComboBall(n)}
                      style={{
                        height: 36,
                        borderRadius: '50%',
                        background: isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)',
                        color: isSelected ? '#000000' : 'var(--text-muted)',
                        border: isSelected ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
                        fontWeight: isSelected ? 800 : 500,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      {n.toString().padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* BẢNG KẾT QUẢ SO KHỚP TỔ HỢP */}
          <div className={styles.colGap14}>
            {/* 5 Thẻ tóm tắt số lần trùng các giải */}
            <div className={styles.gridColsAutoGap10}
            >
              <div
                className="glass-card"
                style={{
                  padding: 14,
                  border: comboEvaluationResults.jackpot1Count > 0 ? '1px solid var(--accent-gold)' : undefined,
                  background: comboEvaluationResults.jackpot1Count > 0 ? 'rgba(245, 158, 11, 0.15)' : undefined,
                }}
              >
                <div className={styles.text072DimCaseUpper}>
                  Jackpot 1 (6/6)
                </div>
                <div className={styles.text16Weight800Gold}
                >
                  {comboEvaluationResults.jackpot1Count}{' '}
                  <span className={styles.text085Muted}>lần</span>
                </div>
              </div>

              {selectedGame === 'vietlott_655' && (
                <div
                  className="glass-card"
                  style={{
                    padding: 14,
                    border: comboEvaluationResults.jackpot2Count > 0 ? '1px solid var(--accent-red)' : undefined,
                    background: comboEvaluationResults.jackpot2Count > 0 ? 'rgba(239, 68, 68, 0.15)' : undefined,
                  }}
                >
                  <div className={styles.text072DimCaseUpper}>
                    Jackpot 2 (5+1)
                  </div>
                  <div className={styles.text16Weight800Red}
                  >
                    {comboEvaluationResults.jackpot2Count}{' '}
                    <span className={styles.text085Muted}>lần</span>
                  </div>
                </div>
              )}

              <div className={`glass-card ${styles.pad14}`}>
                <div className={styles.text072DimCaseUpper}>
                  Giải Nhất (5/6)
                </div>
                <div className={styles.text16Weight800Cyan}
                >
                  {comboEvaluationResults.prize1Count}{' '}
                  <span className={styles.text085Muted}>lần</span>
                </div>
              </div>

              <div className={`glass-card ${styles.pad14}`}>
                <div className={styles.text072DimCaseUpper}>
                  Giải Nhì (4/6)
                </div>
                <div className={styles.text16Weight800Emerald}
                >
                  {comboEvaluationResults.prize2Count}{' '}
                  <span className={styles.text085Muted}>lần</span>
                </div>
              </div>

              <div className={`glass-card ${styles.pad14}`}>
                <div className={styles.text072DimCaseUpper}>
                  Giải Ba (3/6)
                </div>
                <div className={styles.text16Weight800White}
                >
                  {comboEvaluationResults.prize3Count}{' '}
                  <span className={styles.text085Muted}>lần</span>
                </div>
              </div>
            </div>

            {/* Danh sách các kỳ quay trúng thưởng */}
            <div className={`glass-card ${styles.pad18}`}>
              <div className={styles.rowJustifyBetweenCenter}
              >
                <div className={styles.rowText09Weight700}>
                  <Award size={17} color="var(--accent-gold)" />
                  <span>
                    Lịch Sử Các Kỳ Trúng Thưởng ({comboEvaluationResults.matchingDraws.length} kỳ)
                  </span>
                </div>

                <div className={styles.rowCenterGap6}>
                  <span className={styles.text078Dim}>Lọc mức trúng:</span>
                  <select className={styles.pad4x8Round4BgTint}
                    value={minMatchFilter}
                    onChange={(e) => setMinMatchFilter(parseInt(e.target.value, 10))}
                  >
                    <option value={2}>Trùng từ 2 số trở lên</option>
                    <option value={3}>Trùng từ 3 số (Có giải thưởng)</option>
                    <option value={4}>Trùng từ 4 số (Giải Nhì trở lên)</option>
                    <option value={5}>Trùng từ 5 số (Giải Nhất trở lên)</option>
                    <option value={6}>Trúng Jackpot 1 (Đủ 6 số)</option>
                  </select>
                </div>
              </div>

              <div className={styles.maxH260ScrollYAuto}>
                <table className={styles.w100pText085}>
                  <thead>
                    <tr className={styles.borderBottomLineSubtleDimAlignLeft}
                    >
                      <th className={styles.pad8x10}>Kỳ quay & Ngày</th>
                      <th className={styles.pad8x10}>Giải thưởng</th>
                      <th className={styles.pad8x10}>Bộ số mở thưởng (Số trúng được tô vàng)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comboEvaluationResults.matchingDraws.length > 0 ? (
                      comboEvaluationResults.matchingDraws.map((m, idx) => (
                        <tr className={styles.borderBottomLineTint} key={idx}>
                          <td className={styles.pad8x10FontMono}>
                            <strong className={styles.white}>#{m.draw.id}</strong>{' '}
                            <span className={styles.dimText078}>({m.draw.date})</span>
                          </td>
                          <td className={styles.pad8x10}>
                            <span className={`badge ${m.prizeBadge} ${styles.text072}`}>
                              {m.prizeTitle}
                            </span>
                          </td>
                          <td className={styles.pad8x10}>
                            <div className={styles.rowCenterGap5}>
                              {m.draw.balls.map((b, bIdx) => {
                                const isMatched = comboBalls.includes(b);
                                return (
                                  <span
                                    key={bIdx}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 24,
                                      height: 24,
                                      borderRadius: '50%',
                                      background: isMatched ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)',
                                      color: isMatched ? '#000000' : 'var(--text-dim)',
                                      fontSize: '0.72rem',
                                      fontFamily: 'var(--font-mono)',
                                      fontWeight: isMatched ? 800 : 500,
                                    }}
                                  >
                                    {b.toString().padStart(2, '0')}
                                  </span>
                                );
                              })}
                              {m.draw.special && (
                                <>
                                  <span className={styles.dimText075}>+</span>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 24,
                                      height: 24,
                                      borderRadius: '50%',
                                      background: m.matchedSpecial ? 'var(--accent-red)' : 'rgba(239, 68, 68, 0.2)',
                                      color: '#ffffff',
                                      border: '1px solid var(--accent-red)',
                                      fontSize: '0.72rem',
                                      fontFamily: 'var(--font-mono)',
                                      fontWeight: 800,
                                    }}
                                    title="Bóng đặc biệt Jackpot 2"
                                  >
                                    {m.draw.special.toString().padStart(2, '0')}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className={styles.alignCenterPad24Dim} colSpan={3}>
                          Không có kỳ quay nào trùng khớp từ {minMatchFilter} số trở lên.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
  );
};
