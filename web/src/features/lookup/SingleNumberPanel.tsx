import React from 'react';
import { Search, Calendar, AlertTriangle, Layers, Sparkles, Filter, CheckCircle2, BarChart2, Download, Copy, ArrowRight } from 'lucide-react';
import type { InstantLookupModalModel } from './useInstantLookup';
import { ChartNote } from '../../ui';
import styles from './SingleNumberPanel.module.css';

export const SingleNumberPanel: React.FC<{ model: InstantLookupModalModel }> = ({ model }) => {
  const { selectedGame, setSelectedGame, searchQuery, setSearchQuery, selectedYear, setSelectedYear, onlySpecial, setOnlySpecial, onlyMultiHits, setOnlyMultiHits, onlyJackpot2Ball, setOnlyJackpot2Ball, loadingFullHistory, copiedNotice, isVietlott, minNumber, maxNumber, gameUnit, validYears, detectedMultiNumbers, formattedNumber, detail, detailLoading, detailError, loadFullHistory, loadedFullList, filteredHistory, handleExportCSV, handleCopySummary, handleSwitchToComboFromInput, quickPicks } = model;
  return (
        <div className={styles.colGap20}>
          {/* Chọn trò chơi (3 game) & Input Search */}
          <div className={styles.colGap12}>
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
                Vietlott Power 6/55 (01 - 55)
              </button>
              <button
                className={`tab-btn ${selectedGame === 'vietlott_645' ? 'active' : ''} ${styles.flex1MinW160JustifyCenter}`}
                onClick={() => setSelectedGame('vietlott_645')}
              >
                Vietlott Mega 6/45 (01 - 45)
              </button>
            </div>

            <div className={styles.posRelative}>
              <Search className={styles.posAbsoluteGold}
                size={22}
              />
              <input className={styles.w100pPad14x16x14x50RoundMd}
                type="text"
                placeholder={
                  selectedGame === 'xsmb'
                    ? 'Nhập số loto cần tra cứu (ví dụ: 68, 51, 99)...'
                    : selectedGame === 'vietlott_655'
                    ? 'Nhập số bóng Power (01 - 55)...'
                    : 'Nhập số bóng Mega (01 - 45)...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Banner gợi ý thông minh nếu người dùng nhập nhiều số */}
            {detectedMultiNumbers.length >= 2 && (
              <div className={styles.rowBgTintBorderLineTint}
              >
                <div className={styles.rowCenterGap8}>
                  <Sparkles size={16} color="var(--accent-gold)" />
                  <span className={styles.text085White}>
                    Phát hiện bạn đang nhập bộ số gồm <strong>{detectedMultiNumbers.length} số</strong> ({detectedMultiNumbers.map((n) => n.toString().padStart(2, '0')).join(', ')}).
                  </span>
                </div>
                <button className={styles.rowPad6x14RoundSm}
                  onClick={handleSwitchToComboFromInput}
                >
                  <span>Tra Cứu Bộ Số Ngay</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Gợi ý số nhanh */}
            <div className={styles.rowCenterGap84}>
              <span className={styles.text08Dim}>Gợi ý nhanh:</span>
              {quickPicks.map((num) => (
                <button
                  key={num}
                  onClick={() => setSearchQuery(num)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    background: searchQuery === num ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.05)',
                    color: searchQuery === num ? '#000000' : 'var(--text-main)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* KẾT QUẢ TRA CỨU ĐƠN SỐ */}
          {detail ? (
            <div className={styles.colGap18}>
              {/* Banner câu trả lời trực diện */}
              <div className={styles.rowBgGradientBorderLineTint}
              >
                <div className={styles.rowCenterGap16}>
                  <div
                    className={`lottery-ball ${detail.is_gan ? 'ball-red' : 'ball-gold'} ${styles.w72H72Text2}`}
                  >
                    {detail.number}
                  </div>
                  <div>
                    <div className={styles.rowCenterGap83}>
                      <span className={styles.text13Weight800White}>
                        Số {detail.number}
                      </span>
                      <span className={`badge badge-hot ${styles.text078}`}>
                        <CheckCircle2 size={13} />
                        ĐÃ TỪNG VỀ TRONG LỊCH SỬ
                      </span>
                      {detail.is_gan && (
                        <span className={`badge badge-gan ${styles.text078}`}>
                          <AlertTriangle size={13} />
                          ĐANG GAN ({detail.days_since_last} ngày)
                        </span>
                      )}
                    </div>

                    <p className={styles.text092HexM4x0}>
                      {detail.days_since_last === 0
                        ? '🔥 ĐÃ VỀ HÔM NAY trong kỳ quay mới nhất!'
                        : detail.days_since_last === 1
                        ? '⭐ Vừa về ngày hôm qua!'
                        : `Lần gần nhất xuất hiện: ${detail.last_seen_date} (Cách đây ${detail.days_since_last} ngày)`}
                    </p>

                    {detail.first_seen_date && (
                      <p className={styles.text08Muted}>
                        Lần đầu tiên có trong cơ sở dữ liệu: <strong>{detail.first_seen_date}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.colAlignRightEnd}>
                  <div className={styles.text075DimCaseUpper}
                  >
                    Tổng số lần đã về
                  </div>
                  <div className={styles.text21Weight800Gold}
                  >
                    {detail.total_hits.toLocaleString()}{' '}
                    <span className={styles.text11Muted}>{gameUnit}</span>
                  </div>
                  {selectedGame === 'xsmb' && detail.special_hits !== undefined && (
                    <div className={styles.text08RedWeight600}>
                      Là 2 số cuối Giải Đặc Biệt: {detail.special_hits} lần
                    </div>
                  )}
                  <button
                    onClick={handleCopySummary}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: copiedNotice ? 'var(--accent-emerald)' : 'var(--text-dim)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      marginTop: 4,
                    }}
                  >
                    <Copy size={12} />
                    {copiedNotice ? 'Đã sao chép!' : 'Sao chép tóm tắt'}
                  </button>
                </div>
              </div>

              {/* Grid 4 thẻ thống kê nhịp & tần suất */}
              <div className={styles.gridColsAutoGap12}
              >
                <div className={`glass-card ${styles.pad14}`}>
                  <div className={styles.text075Dim}>Số ngày chưa về (Hiện tại)</div>
                  <div
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: detail.is_gan ? 'var(--accent-red)' : '#ffffff',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {detail.days_since_last} <span className={styles.text08Weight500}>ngày</span>
                  </div>
                </div>

                <div className={`glass-card ${styles.pad14}`}>
                  <div className={styles.text075Dim}>Kỷ lục gan lớn nhất lịch sử</div>
                  <div className={styles.text14Weight800Gold}
                  >
                    {detail.max_gap_historical} <span className={styles.text08Weight500}>ngày</span>
                  </div>
                </div>

                <div className={`glass-card ${styles.pad14}`}>
                  <div className={styles.text075Dim}>Chu kỳ nhịp trung bình</div>
                  <div className={styles.text14Weight800Cyan}
                  >
                    {detail.average_gap} <span className={styles.text08Weight500}>ngày/lần</span>
                  </div>
                </div>

                <div className={`glass-card ${styles.pad14}`}>
                  <div className={styles.text075Dim}>Tần suất 30 ngày qua</div>
                  <div className={styles.text14Weight800Emerald}
                  >
                    {detail.freq_30d} <span className={styles.text08Weight500}>{gameUnit}</span>
                  </div>
                </div>
              </div>

              {/* Biểu đồ phân bố xuất hiện theo năm (Yearly Distribution) */}
              {detail.yearly_distribution && Object.keys(detail.yearly_distribution).length > 0 && (
                <div className={`glass-card ${styles.pad16}`}>
                  <div className={styles.rowJustifyBetweenCenter2}
                  >
                    <span className={styles.rowText085Weight7002}
                    >
                      <BarChart2 size={16} color="var(--accent-cyan)" />
                      Phân Bố Số Lần Về Theo Từng Năm (Click vào năm để lọc)
                    </span>
                    {selectedYear !== 'all' && (
                      <button className={styles.bgClearBorderNoneGold}
                        onClick={() => setSelectedYear('all')}
                      >
                        Xóa lọc (Hiện tất cả)
                      </button>
                    )}
                  </div>

                  <div className={styles.rowEndGap6}
                  >
                    {Object.entries(detail.yearly_distribution).map(([yr, count]) => {
                      const maxCount = Math.max(...Object.values(detail.yearly_distribution || {}));
                      const heightPct = Math.max(15, Math.round((count / (maxCount || 1)) * 100));
                      const isSelected = selectedYear === yr;
                      return (
                        <div className={styles.colCenterGap4}
                          key={yr}
                          onClick={async () => {
                            setSelectedYear(isSelected ? 'all' : yr);
                            if (!loadedFullList) loadFullHistory();
                          }}
                        >
                          <span className={styles.text065GoldWeight700}>
                            {count}
                          </span>
                          <div
                            style={{
                              width: '100%',
                              height: `${heightPct}%`,
                              background: isSelected
                                ? 'var(--accent-gold)'
                                : 'linear-gradient(180deg, rgba(56, 189, 248, 0.8), rgba(59, 130, 246, 0.4))',
                              borderRadius: '3px 3px 0 0',
                              transition: 'height 0.3s ease',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.65rem',
                              color: isSelected ? 'var(--accent-gold)' : 'var(--text-dim)',
                              fontWeight: isSelected ? 800 : 500,
                            }}
                          >
                            {yr.slice(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <ChartNote
                    sample={`${detail.total_hits.toLocaleString('vi-VN')} lần về trong ${Object.keys(detail.yearly_distribution).length} năm${detail.first_seen_date ? ` (từ ${detail.first_seen_date})` : ''}`}
                    warning="Năm đầu và năm hiện tại chưa đủ 12 tháng nên cột thấp hơn. Chênh lệch giữa các năm còn lại là dao động ngẫu nhiên và không cho biết trước kết quả kỳ sau."
                  />
                </div>
              )}

              {/* Cặp số hay về cùng */}
              {detail.top_pairs && detail.top_pairs.length > 0 && (
                <div className={`glass-card ${styles.pad16}`}>
                  <div className={styles.rowText085Weight700}
                  >
                    <Layers size={16} color="var(--accent-cyan)" />
                    Cặp số hay về cùng {detail.number} nhất (Thống kê 1 năm qua)
                  </div>
                  <div className={styles.rowGap10}>
                    {detail.top_pairs.map((p) => (
                      <div className={styles.rowCenterGap82}
                        key={p.number}
                        onClick={() => setSearchQuery(p.number)}
                      >
                        <span
                          className={`lottery-ball ball-slate ${styles.w26H26Text08}`}
                        >
                          {p.number}
                        </span>
                        <span className={styles.text078Muted}>
                          cùng về <strong className={styles.gold}>{p.co_count}</strong> {gameUnit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DÒNG THỜI GIAN TOÀN BỘ CÁC LẦN XUẤT HIỆN */}
              <div className={`glass-card ${styles.pad18}`}>
                <div className={styles.rowJustifyBetweenCenter}
                >
                  <div className={styles.rowText09Weight700}
                  >
                    <Calendar size={17} color="var(--accent-emerald)" />
                    <span>
                      Dòng Thời Gian Xuất Hiện (
                      {loadedFullList
                        ? `Toàn bộ ${filteredHistory.length}/${detail.total_hits} ${gameUnit}`
                        : `Đang xem ${filteredHistory.length} ${gameUnit} gần nhất`}
                      )
                    </span>
                  </div>

                  <div className={styles.rowCenterGap8}>
                    {/* Nút Xuất CSV */}
                    <button className={styles.rowCenterGap5}
                      onClick={handleExportCSV}
                      title="Tải về file CSV để xem trên Excel"
                    >
                      <Download size={13} />
                      <span>Xuất CSV</span>
                    </button>

                    {/* Nút tải full lịch sử nếu chưa tải */}
                    {!loadedFullList && (
                      <button className={styles.pad6x12RoundSmBgTint}
                        onClick={() => loadFullHistory()}
                        disabled={loadingFullHistory}
                      >
                        {loadingFullHistory
                          ? 'Đang tải...'
                          : `⚡ Tải Toàn Bộ Lịch Sử (${detail.total_hits} ${gameUnit})`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Bộ lọc Năm & Tùy chọn game-aware */}
                <div className={styles.rowCenterGap12}
                >
                  <div className={styles.rowCenterGap62}>
                    <Filter size={14} color="var(--text-dim)" />
                    <span className={styles.text078Dim}>Năm:</span>
                    <select className={styles.pad4x8Round4BgTint}
                      value={selectedYear}
                      onChange={async (e) => {
                        const yr = e.target.value;
                        setSelectedYear(yr);
                        if (yr !== 'all' && !loadedFullList) {
                          loadFullHistory();
                        }
                      }}
                    >
                      <option value="all">
                        Tất cả ({validYears[validYears.length - 1]} - 2026)
                      </option>
                      {validYears
                        .filter((y) => y !== 'all')
                        .map((y) => (
                          <option key={y} value={y}>
                            Năm {y}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Bộ lọc riêng của XSMB */}
                  {selectedGame === 'xsmb' && (
                    <>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.78rem',
                          color: onlySpecial ? 'var(--accent-red)' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={onlySpecial}
                          onChange={(e) => setOnlySpecial(e.target.checked)}
                        />
                        Chỉ hiện 2 số cuối Giải Đặc Biệt
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.78rem',
                          color: onlyMultiHits ? 'var(--accent-gold)' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={onlyMultiHits}
                          onChange={(e) => setOnlyMultiHits(e.target.checked)}
                        />
                        Chỉ hiện xuất hiện ≥ 2 lần
                      </label>
                    </>
                  )}

                  {/* Bộ lọc riêng của Vietlott Power 6/55 */}
                  {selectedGame === 'vietlott_655' && (
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.78rem',
                        color: onlyJackpot2Ball ? 'var(--accent-gold)' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={onlyJackpot2Ball}
                        onChange={(e) => setOnlyJackpot2Ball(e.target.checked)}
                      />
                      ★ Chỉ hiện khi là Bóng Đặc Biệt (Jackpot 2)
                    </label>
                  )}
                </div>

                {/* Bảng danh sách các ngày đã về */}
                <div className={styles.maxH280ScrollYAuto}>
                  <table className={styles.w100pText085}>
                    <thead>
                      <tr className={styles.borderBottomLineSubtleDimAlignLeft}
                      >
                        <th className={styles.pad8x10}>Ngày quay</th>
                        <th className={styles.pad8x10}>
                          {isVietlott ? 'Vị trí bóng' : 'Số lần'}
                        </th>
                        <th className={styles.pad8x10}>
                          {isVietlott ? 'Toàn bộ bộ số kỳ quay' : 'Chi tiết giải trúng'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.length > 0 ? (
                        filteredHistory.map((hist, idx) => {
                          const targetNum = parseInt(formattedNumber, 10);
                          const isJp2Ball =
                            isVietlott &&
                            selectedGame === 'vietlott_655' &&
                            hist.result &&
                            hist.result.length > 6 &&
                            hist.result[6] === targetNum;

                          return (
                            <tr className={styles.borderBottomLineTint} key={idx}>
                              <td className={styles.pad8x10FontMonoWeight600}>
                                {hist.date}
                              </td>
                              <td className={styles.pad8x10}>
                                {isVietlott ? (
                                  isJp2Ball ? (
                                    <span
                                      className={`badge badge-hot ${styles.text072BgGradientBlack}`}
                                    >
                                      ★ BÓNG ĐẶC BIỆT (JP2)
                                    </span>
                                  ) : (
                                    <span className={`badge badge-normal ${styles.text072}`}>
                                      🎯 Bóng chính (JP1)
                                    </span>
                                  )
                                ) : (
                                  <span className={`badge badge-hot ${styles.text072}`}>
                                    {hist.hits || 1} lần
                                  </span>
                                )}
                              </td>
                              <td className={styles.pad8x10}>
                                {isVietlott && hist.result ? (
                                  <div className={styles.rowCenterGap6}>
                                    {hist.id && (
                                      <span className={styles.text075DimMr4}>
                                        Kỳ #{hist.id}:
                                      </span>
                                    )}
                                    {hist.result.slice(0, 6).map((b, bIdx) => (
                                      <span
                                        key={bIdx}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: 24,
                                          height: 24,
                                          borderRadius: '50%',
                                          background: b === targetNum ? 'var(--accent-gold)' : 'rgba(255,255,255,0.08)',
                                          color: b === targetNum ? '#000000' : '#ffffff',
                                          fontSize: '0.72rem',
                                          fontFamily: 'var(--font-mono)',
                                          fontWeight: 700,
                                        }}
                                      >
                                        {b.toString().padStart(2, '0')}
                                      </span>
                                    ))}
                                    {hist.result.length > 6 && (
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
                                            background: hist.result[6] === targetNum ? 'var(--accent-red)' : 'rgba(239, 68, 68, 0.25)',
                                            color: '#ffffff',
                                            border: '1px solid var(--accent-red)',
                                            fontSize: '0.72rem',
                                            fontFamily: 'var(--font-mono)',
                                            fontWeight: 800,
                                          }}
                                          title="Bóng đặc biệt Jackpot 2"
                                        >
                                          {hist.result[6].toString().padStart(2, '0')}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ color: hist.is_special ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                                    {hist.is_special && '★ 2 SỐ CUỐI GIẢI ĐẶC BIỆT • '}
                                    {hist.prizes ? hist.prizes.join(', ') : 'Trúng thưởng'}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className={styles.alignCenterPad24Dim} colSpan={3}>
                            Không có lần xuất hiện nào khớp với bộ lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : detailLoading ? (
            <div className={styles.alignCenterPad40x20Dim} role="status">
              <p className={styles.text085}>Đang tải thống kê số {formattedNumber}...</p>
            </div>
          ) : detailError && !detailError.message.includes('HTTP 404') ? (
            <div className={styles.alignCenterPad40x20Dim} role="alert">
              <p className={styles.text11Mb8}>Không tải được thống kê số {formattedNumber}</p>
              <p className={styles.text085}>Kiểm tra kết nối mạng rồi thử lại.</p>
            </div>
          ) : searchQuery ? (
            <div className={styles.alignCenterPad40x20Dim}>
              <p className={styles.text11Mb8}>Không tìm thấy dữ liệu cho số "{searchQuery}"</p>
              <p className={styles.text085}>Vui lòng nhập một số hợp lệ từ {minNumber.toString().padStart(2, '0')} đến {maxNumber}.</p>
            </div>
          ) : (
            <div className={styles.alignCenterPad40x20Dim}>
              <Search className={styles.opacity03Mb12} size={40} />
              <p className={styles.text1Muted}>
                Nhập số bất kỳ ở ô trên để tra cứu ngay lịch sử và chu kỳ gan!
              </p>
            </div>
          )}
        </div>
  );
};
