'use client';

import { formatTimeAgo } from './EventCard';

export default function CompactRadar({ title, events }) {
  if (!events || events.length === 0) return null;

  return (
    <div style={{ marginBottom: '36px' }}>
      <div className="section-header">
        <h2 className="section-title-text">{title}</h2>
        <span className="section-badge">{events.length} EVENTS</span>
      </div>

      <div className="compact-list">
        {events.map((e) => {
          const primaryArticle = e.eventArticles?.[0]?.article;
          const sourceName = primaryArticle?.source?.name || 'Verified Source';
          const url = primaryArticle?.url || '#';

          return (
            <div key={e.id} className="compact-item">
              <div>
                <div className="compact-title">{e.canonicalTitle}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {e.summary}
                </div>
              </div>

              <div className="compact-meta">
                <span>{sourceName}</span>
                <span style={{ margin: '0 6px' }}>•</span>
                <span>{formatTimeAgo(e.firstSeenAt)}</span>
                <span style={{ margin: '0 6px' }}>•</span>
                <a href={url} target="_blank" rel="noopener noreferrer" className="source-link">
                  Link →
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
