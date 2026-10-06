import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      {/* Hero Banner Skeleton */}
      <div className="glass-card" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="skeleton-box" style={{ width: 44, height: 44, borderRadius: '50%' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton-box" style={{ width: 320, height: 22 }} />
            <div className="skeleton-box" style={{ width: 220, height: 14 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="skeleton-box" style={{ width: 140, height: 38, borderRadius: 9999 }} />
          <div className="skeleton-box" style={{ width: 110, height: 38, borderRadius: 9999 }} />
        </div>
      </div>

      {/* Universal Quick Checker Skeleton */}
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className="skeleton-box" style={{ width: 44, height: 44, borderRadius: '50%' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skeleton-box" style={{ width: 200, height: 20 }} />
            <div className="skeleton-box" style={{ width: 340, height: 14 }} />
          </div>
        </div>
        <div className="skeleton-box" style={{ width: '100%', height: 48, borderRadius: 10, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton-box" style={{ width: 80, height: 26, borderRadius: 9999 }} />
          <div className="skeleton-box" style={{ width: 110, height: 26, borderRadius: 9999 }} />
          <div className="skeleton-box" style={{ width: 95, height: 26, borderRadius: 9999 }} />
        </div>
      </div>

      {/* 2 Cột Bảng Kết Quả Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="skeleton-box" style={{ width: 180, height: 22 }} />
            <div className="skeleton-box" style={{ width: 90, height: 22, borderRadius: 6 }} />
          </div>
          <div className="skeleton-box" style={{ width: '100%', height: 60, borderRadius: 8 }} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-box" style={{ width: '100%', height: 38, borderRadius: 6 }} />
          ))}
        </div>

        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="skeleton-box" style={{ width: 180, height: 22 }} />
            <div className="skeleton-box" style={{ width: 140, height: 18 }} />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="skeleton-box" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              <div className="skeleton-box" style={{ flex: 1, height: 28, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
