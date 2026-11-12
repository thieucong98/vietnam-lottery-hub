import React from 'react';
import { ExternalLink } from 'lucide-react';

export const OFFICIAL_SOURCES = {
  vietlott: { label: 'Vietlott', url: 'https://vietlott.vn/' },
  xsktThuDo: { label: 'XSKT Thủ đô', url: 'https://xosothudo.com.vn/' },
} as const;

interface OfficialResultsLinkProps {
  sources: (keyof typeof OFFICIAL_SOURCES)[];
}

// Liên kết tới nguồn kết quả chính thức, hiển thị trên mọi màn hình kết quả
export const OfficialResultsLink: React.FC<OfficialResultsLinkProps> = ({ sources }) => {
  return (
    <div
      style={{
        marginTop: 14,
        paddingTop: 10,
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.76rem',
        color: 'var(--text-dim)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
      }}
    >
      <span>Dữ liệu tổng hợp tự động, có thể chậm hoặc sai sót. Kết quả chính thức:</span>
      {sources.map((key) => (
        <a
          key={key}
          href={OFFICIAL_SOURCES[key].url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: 3 }}
        >
          {OFFICIAL_SOURCES[key].label}
          <ExternalLink size={12} />
        </a>
      ))}
    </div>
  );
};
