import React from 'react';
import {
  Search,
  Flame,
  BarChart3,
  Brain,
  Dices,
  Calendar,
  Github,
  Sparkles,
  Filter,
  Trophy,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenLegal?: () => void;
  latestDate?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSearch,
  onOpenLegal,
  latestDate,
}) => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(8, 12, 20, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* LOGO & BRANDING */}
        <div
          onClick={() => setCurrentTab('xsmb')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <div
            className="lottery-ball ball-gold"
            style={{ width: 38, height: 38, fontSize: '1.1rem', fontWeight: 800 }}
          >
            88
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '1.12rem',
                  letterSpacing: '-0.02em',
                  background:
                    'linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #ef4444 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                VIETNAM LOTTERY
              </span>
              <span className="badge badge-hot" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
                PRO
              </span>
            </div>
            {latestDate && (
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  lineHeight: 1,
                  marginTop: 2,
                }}
              >
                <span>Kỳ mới nhất:</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  {latestDate}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* DESKTOP NAVIGATION TABS (ẨN TRÊN MOBILE < 900PX) */}
        <nav
          className="hide-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '4px 6px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            overflowX: 'auto',
          }}
        >
          <button
            className={`tab-btn ${currentTab === 'xsmb' ? 'active' : ''}`}
            onClick={() => setCurrentTab('xsmb')}
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
          >
            <Calendar size={15} />
            <span>XSMB</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'vietlott_655' ? 'active' : ''}`}
            onClick={() => setCurrentTab('vietlott_655')}
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
          >
            <Dices size={15} />
            <span>Power 6/55</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'vietlott_645' ? 'active' : ''}`}
            onClick={() => setCurrentTab('vietlott_645')}
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
          >
            <Dices size={15} />
            <span>Mega 6/45</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'keno_3d' ? 'active' : ''}`}
            onClick={() => setCurrentTab('keno_3d')}
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
          >
            <Zap size={15} color={currentTab === 'keno_3d' ? 'var(--accent-gold)' : undefined} />
            <span>Keno & 3D</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setCurrentTab('heatmap')}
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
          >
            <Flame size={15} />
            <span>Nhiệt</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'gan' ? 'active' : ''}`}
            onClick={() => setCurrentTab('gan')}
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
          >
            <BarChart3 size={15} />
            <span>Lô Gan</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'bacnho' ? 'active' : ''}`}
            onClick={() => setCurrentTab('bacnho')}
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
          >
            <Sparkles size={15} color="#c084fc" />
            <span>Bạc Nhớ</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'filter' ? 'active' : ''}`}
            onClick={() => setCurrentTab('filter')}
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
          >
            <Filter size={15} color="#10b981" />
            <span>Lọc Vé</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'ai' ? 'active' : ''}`}
            onClick={() => setCurrentTab('ai')}
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
          >
            <Brain size={15} />
            <span>AI</span>
          </button>
        </nav>

        {/* ACTIONS & EXTERNAL LINKS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Quick Search Action */}
          <button
            onClick={onOpenSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              background:
                'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(239, 68, 68, 0.12))',
              border: '1px solid var(--accent-gold)',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 0 12px rgba(245, 158, 11, 0.2)',
            }}
          >
            <Search size={15} color="var(--accent-gold)" />
            <span>Tra Cứu</span>
            <kbd
              className="hide-mobile"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 4,
                padding: '1px 5px',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-gold)',
              }}
            >
              Ctrl K
            </kbd>
          </button>

          {/* 18+ Legal */}
          {onOpenLegal && (
            <button
              onClick={onOpenLegal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Quy Định Pháp Lý & Chơi Có Trách Nhiệm (18+)"
            >
              <ShieldCheck size={15} color="#10b981" />
              <span className="hide-mobile">18+ Pháp Lý</span>
            </button>
          )}

          {/* GitHub Icon */}
          <a
            href="https://github.com/thieucong98/vietnam-lottery-hub"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
            title="Mã nguồn mở trên GitHub"
          >
            <Github size={16} />
          </a>
        </div>
      </div>
    </header>
  );
};
