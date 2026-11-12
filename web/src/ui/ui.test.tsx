import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Ball, Button, Modal, Table, Tabs } from './index';

describe('bộ component cơ bản', () => {
  it('Ball hiển thị số 2 chữ số và có nhãn khi bấm được', () => {
    const onClick = vi.fn();
    render(<Ball value={7} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Số 07' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('Button mặc định type="button"', () => {
    render(<Button>Đồng ý</Button>);
    expect(screen.getByRole('button', { name: 'Đồng ý' })).toHaveAttribute('type', 'button');
  });

  it('Tabs đánh dấu tab đang chọn và gọi onChange', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        ariaLabel="Chế độ"
        value="a"
        onChange={onChange}
        items={[
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ]}
      />
    );
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('Table hiển thị dòng trống khi không có dữ liệu', () => {
    render(<Table columns={[{ key: 'x', header: 'X', render: () => null }]} rows={[]} rowKey={(_, i) => i} emptyText="Trống" />);
    expect(screen.getByText('Trống')).toBeInTheDocument();
  });

  it('Modal có role dialog, đóng bằng Esc và nút Đóng', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Tiêu đề">
        nội dung
      </Modal>
    );
    expect(screen.getByRole('dialog', { name: 'Tiêu đề' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
