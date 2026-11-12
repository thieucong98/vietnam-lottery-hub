import React from 'react';
import type { InstantLookupModalModel } from './useInstantLookup';
import styles from './PairPanel.module.css';

export const PairPanel: React.FC<{ model: InstantLookupModalModel }> = ({ model }) => {
  const { cooccurrenceData, selectedGame, setSelectedGame, pairNum1, setPairNum1, pairNum2, setPairNum2, pairLoading, pairError, pairMatches, isVietlott, gameUnit, handleCheckPair } = model;
  return (
        <div className={styles.colGap20}>
          {/* Chọn trò chơi */}
          <div className={styles.rowGap10}>
            <button
              className={`tab-btn ${selectedGame === 'xsmb' ? 'active' : ''} ${styles.flex1MinW140JustifyCenter}`}
              onClick={() => setSelectedGame('xsmb')}
            >
              XSMB (00 - 99)
            </button>
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

          <div className={styles.bgTintPad18RoundMd}
          >
            <h3 className={styles.text1Weight800Mb6}>
              {isVietlott ? 'Kiểm Tra Lịch Sử Cặp Số Cùng Về (Pairs)' : 'Cặp số cùng xuất hiện (thống kê)'}
            </h3>
            <p className={styles.text082MutedMb16}>
              Kiểm tra xem 2 số này đã bao giờ cùng xuất hiện trong một kỳ mở thưởng chưa, tổng cộng bao nhiêu lần và lần gần nhất là khi nào.
            </p>

            {/* Top Pairs Presets khi chọn Vietlott */}
            {isVietlott && cooccurrenceData && (
              <div className={styles.rowMb14Center}>
                <span className={styles.text078Dim}>Gợi ý Top Cặp Hot:</span>
                {(cooccurrenceData[selectedGame as 'vietlott_655' | 'vietlott_645']?.top_pairs || []).slice(0, 5).map((p, idx) => (
                  <button className={styles.pad3x8RoundSmBgTint}
                    key={idx}
                    onClick={() => {
                      setPairNum1(p.numbers[0]);
                      setPairNum2(p.numbers[1]);
                    }}
                  >
                    {p.numbers[0]} - {p.numbers[1]} ({p.hits} {gameUnit})
                  </button>
                ))}
              </div>
            )}

            <div className={styles.rowCenterGap12}>
              <div className={styles.rowCenterGap8}>
                <span className={styles.text085Muted}>Số 1:</span>
                <input className={styles.w80Pad8x12RoundSm}
                  type="number"
                  value={pairNum1}
                  onChange={(e) => setPairNum1(e.target.value)}
                />
              </div>

              <span className={styles.text12Weight800Gold}>+</span>

              <div className={styles.rowCenterGap8}>
                <span className={styles.text085Muted}>Số 2:</span>
                <input className={styles.w80Pad8x12RoundSm}
                  type="number"
                  value={pairNum2}
                  onChange={(e) => setPairNum2(e.target.value)}
                />
              </div>

              <button className={styles.pad10x20RoundSmBgGold}
                onClick={handleCheckPair}
                disabled={pairLoading}
              >
                {pairLoading ? 'Đang phân tích...' : 'Kiểm Tra Cặp Số Ngay'}
              </button>
            </div>
          </div>

          {pairError && (
            <p className={styles.text085Muted} role="alert">
              Không tải được lịch sử của cặp số này. Kiểm tra kết nối mạng rồi thử lại.
            </p>
          )}

          {/* Kết quả cặp số cùng xuất hiện */}
          {pairMatches !== null && (
            <div className={styles.colGap16}>
              <div className={styles.rowBgGradientBorderLineTint}
              >
                <div className={styles.rowCenterGap14}>
                  <div className={styles.rowGap6}>
                    <div className={`lottery-ball ball-gold ${styles.w48H48Text1252}`}>
                      {pairNum1.padStart(2, '0')}
                    </div>
                    <div
                      className={`lottery-ball ball-gold ${styles.w48H48Text125}`}
                    >
                      {pairNum2.padStart(2, '0')}
                    </div>
                  </div>
                  <div>
                    <div className={styles.text115Weight800White}>
                      Cặp {pairNum1.padStart(2, '0')} - {pairNum2.padStart(2, '0')}
                    </div>
                    <p className={styles.text085Muted}>
                      {pairMatches.length > 0
                        ? `Lần gần nhất cùng về: ${pairMatches[0].date}`
                        : 'Chưa từng cùng xuất hiện trong một kỳ'}
                    </p>
                  </div>
                </div>

                <div className={styles.alignRight}>
                  <div className={styles.text075DimCaseUpper}>
                    Tổng số lần cùng về
                  </div>
                  <div className={styles.text18Weight800Gold}
                  >
                    {pairMatches.length} <span className={styles.text1Muted}>{gameUnit}</span>
                  </div>
                </div>
              </div>

              {/* Bảng các ngày cùng xuất hiện */}
              <div className={`glass-card ${styles.pad16}`}>
                <div className={styles.text088Weight700Mb12}>
                  Danh Sách Các Ngày Cả 2 Số Cùng Xuất Hiện ({pairMatches.length} {gameUnit})
                </div>
                <div className={styles.maxH240ScrollYAuto}>
                  <table className={styles.w100pText085}>
                    <thead>
                      <tr className={styles.borderBottomLineSubtleDimAlignLeft}
                      >
                        <th className={styles.pad8x10}>Ngày quay</th>
                        <th className={styles.pad8x10}>Số {pairNum1}</th>
                        <th className={styles.pad8x10}>Số {pairNum2}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pairMatches.map((m, idx) => (
                        <tr className={styles.borderBottomLineTint} key={idx}>
                          <td className={styles.pad8x10FontMonoWeight600}>
                            {m.date}
                          </td>
                          <td className={styles.pad8x10}>
                            {isVietlott ? (
                              m.isSpecial1 ? (
                                <span className={`badge badge-hot ${styles.text072}`}>
                                  ★ Bóng JP2
                                </span>
                              ) : (
                                <span className={`badge badge-normal ${styles.text072}`}>
                                  🎯 Bóng chính
                                </span>
                              )
                            ) : (
                              <span className={`badge badge-hot ${styles.text072}`}>
                                {m.num1Hits} lần
                              </span>
                            )}
                          </td>
                          <td className={styles.pad8x10}>
                            {isVietlott ? (
                              m.isSpecial2 ? (
                                <span className={`badge badge-hot ${styles.text072}`}>
                                  ★ Bóng JP2
                                </span>
                              ) : (
                                <span className={`badge badge-normal ${styles.text072}`}>
                                  🎯 Bóng chính
                                </span>
                              )
                            ) : (
                              <span className={`badge badge-normal ${styles.text072}`}>
                                {m.num2Hits} lần
                              </span>
                            )}
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
  );
};
