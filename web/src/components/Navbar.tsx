import React from 'react';
import { Search, Flame, BarChart3, Brain, Dices, Calendar, Github, Sparkles, Filter, Trophy } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSearch: () => void;
  latestDate?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSearch,
  latestDate,
}) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(8, 12, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 24px',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        {/* Logo */}
        <div 
          onClick={() => setCurrentTab('xsmb')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          <div className="lottery-ball ball-gold" style={{ width: 42, height: 42, fontSize: '1.2rem' }}>
            88
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                VIETNAM LOTTERY
              </span>
              <span className="badge badge-hot" style={{ fontSize: '0.65rem' }}>PRO 2026</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Phân Tích & Tra Cứu Xổ Số & Vietlott</span>
              {latestDate && (
                <>
                  <span>•</span>
                  <span style={{ color: 'var(--accent-emerald)' }}>Kỳ mới nhất: {latestDate}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            className={`tab-btn ${currentTab === 'xsmb' ? 'active' : ''}`}
            onClick={() => setCurrentTab('xsmb')}
          >
            <Calendar size={18} />
            <span>XSMB</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'vietlott_655' ? 'active' : ''}`}
            onClick={() => setCurrentTab('vietlott_655')}
          >
            <Dices size={18} />
            <span>Power 6/55</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'vietlott_645' ? 'active' : ''}`}
            onClick={() => setCurrentTab('vietlott_645')}
          >
            <Dices size={18} />
            <span>Mega 6/45</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'vietlott_combo' ? 'active' : ''}`}
            onClick={() => setCurrentTab('vietlott_combo')}
          >
            <Trophy size={18} color="var(--accent-gold)" />
            <span>Bộ Số Vietlott</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setCurrentTab('heatmap')}
          >
            <Flame size={18} />
            <span>Ma Trận Nhiệt</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'gan' ? 'active' : ''}`}
            onClick={() => setCurrentTab('gan')}
          >
            <BarChart3 size={18} />
            <span>Lô Gan & Tần Suất</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'bacnho' ? 'active' : ''}`}
            onClick={() => setCurrentTab('bacnho')}
          >
            <Sparkles size={18} color="#a855f7" />
            <span>Bạc Nhớ 20 Năm</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'filter' ? 'active' : ''}`}
            onClick={() => setCurrentTab('filter')}
          >
            <Filter size={18} color="#10b981" />
            <span>Lọc & So Vé</span>
          </button>

          <button
            className={`tab-btn ${currentTab === 'ai' ? 'active' : ''}`}
            onClick={() => setCurrentTab('ai')}
          >
            <Brain size={18} />
            <span>AI & Backtest</span>
          </button>
        </nav>

        {/* Quick Search Action & Github */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onOpenSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.15))',
              border: '1px solid var(--accent-gold)',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            <Search size={16} />
            <span>Tra Cứu</span>
            <kbd style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 4,
              padding: '1px 6px',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-gold)',
            }}>
              Ctrl K
            </kbd>
          </button>

          <a
            href="https://github.com/thieucong98/vietnam-lottery-hub"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
            title="GitHub Repository"
          >
            <Github size={18} />
          </a>
        </div>
      </div>
    </header>
  );
};
