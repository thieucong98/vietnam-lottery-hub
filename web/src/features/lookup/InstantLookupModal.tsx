import React, { useId } from 'react';
import { Search, Trophy, Layers } from 'lucide-react';
import { Ball, Modal, Tabs, tabId } from '../../ui';
import type { LookupMode } from '../../app/routes';
import { useInstantLookup } from './useInstantLookup';
import { SingleNumberPanel } from './SingleNumberPanel';
import { CombinationPanel } from './CombinationPanel';
import { PairPanel } from './PairPanel';
import styles from './InstantLookupModal.module.css';
export type { InstantLookupModalProps } from './useInstantLookup';
import type { InstantLookupModalProps } from './useInstantLookup';

const SINGLE_LABEL = {
  xsmb: 'Tra Cứu Đơn Số (00 - 99)',
  vietlott_655: 'Tra Cứu Đơn Bóng (01 - 55)',
  vietlott_645: 'Tra Cứu Đơn Bóng (01 - 45)',
} as const;

export const InstantLookupModal: React.FC<InstantLookupModalProps> = (props) => {
  const model = useInstantLookup(props);
  const { activeTabMode, setActiveTabMode, selectedGame, isVietlott } = model;
  const panelId = useId();

  const tabs = (
    <Tabs<LookupMode>
      ariaLabel="Chế độ tra cứu"
      panelId={panelId}
      value={activeTabMode}
      onChange={setActiveTabMode}
      items={[
        { id: 'single', label: SINGLE_LABEL[selectedGame], icon: <Search size={15} /> },
        { id: 'combination', label: 'Tra Cứu Bộ Số & Vé Bao (2 - 18 Số)', icon: <Trophy size={15} /> },
        {
          id: 'pair',
          label: isVietlott ? 'Cặp Số Cùng Về (Pairs)' : 'Cặp số cùng xuất hiện (thống kê)',
          icon: <Layers size={15} />,
        },
      ]}
    />
  );

  return (
    <Modal
      open
      onClose={props.onClose}
      size="lg"
      icon={
        <Ball value="" tone="gold" size="md">
          <Search size={18} />
        </Ball>
      }
      title="Trung Tâm Tra Cứu Lịch Sử & Kiểm Tra Kết Quả"
      subtitle={
        <>
          Tra cứu xem số hoặc bộ vé đã từng về bao giờ chưa, số lần trùng giải Jackpot trong lịch sử, chu kỳ gan & lịch sử
          chi tiết (Phím tắt: <kbd className={styles.kbd}>Esc</kbd>)
        </>
      }
      toolbar={tabs}
    >
      <div role="tabpanel" id={panelId} aria-labelledby={tabId(panelId, activeTabMode)}>
        {activeTabMode === 'single' && <SingleNumberPanel model={model} />}
        {activeTabMode === 'combination' && <CombinationPanel model={model} />}
        {activeTabMode === 'pair' && <PairPanel model={model} />}
      </div>
    </Modal>
  );
};
