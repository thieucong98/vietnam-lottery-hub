import React from 'react';
import { POPULAR_PATTERN_LABELS, PopularPattern } from '../../utils/quickPick';

/**
 * Gợi ý tránh chia giải, trình bày đúng phạm vi: xác suất trúng không đổi,
 * chỉ khả năng phải chia Jackpot với người chọn cùng bộ số là thay đổi.
 */
export const AvoidSharingNote: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className}>
    <strong>Gợi ý tránh chia giải.</strong> Mọi bộ số có cùng xác suất trúng, kể cả 01-02-03-04-05-06. Điều thay đổi là{' '}
    <strong>số người có thể chọn trùng bộ số với bạn</strong>: Jackpot được chia đều cho mọi vé trúng, nên nếu bộ số được nhiều người chọn
    thì phần mỗi người nhận ít hơn. Các bộ số hay được chọn:
    <ul>
      {(Object.keys(POPULAR_PATTERN_LABELS) as PopularPattern[]).map((p) => (
        <li key={p}>{POPULAR_PATTERN_LABELS[p]}</li>
      ))}
      <li>Các hình vẽ trên vé (hàng ngang, hàng dọc, đường chéo trên phiếu tô)</li>
    </ul>
    Tránh các bộ này không làm tăng khả năng trúng, chỉ giảm khả năng phải chia Jackpot nếu trúng.
  </div>
);
