'use client';

import Link from 'next/link';

export default function Header({ onRefresh, refreshing }) {
  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="radar-header">
      <div className="logo-area">
        <div className="radar-dot" title="Live Radar Monitoring Active"></div>
        <div>
          <h1 className="app-title">AI NEWS RADAR</h1>
          <div className="app-subtitle">VERIFIED INTELLIGENCE DASHBOARD • {currentDateStr}</div>
        </div>
      </div>

      <div className="header-actions">
        <button 
          className="btn-secondary" 
          onClick={onRefresh} 
          disabled={refreshing}
          title="Trigger RSS Ingestion & Clustering"
        >
          {refreshing ? '🔄 Ingesting Feeds...' : '⚡ Sync Radar'}
        </button>

        <Link href="/admin" className="btn-secondary">
          ⚙️ Health & Logs
        </Link>
      </div>
    </header>
  );
}
