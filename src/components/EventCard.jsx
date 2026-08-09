'use client';

export function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

export function getVerificationBadge(status) {
  switch (status) {
    case 'CONFIRMED':
      return <span className="verification-pill v-confirmed">CONFIRMED</span>;
    case 'PRIMARY_SOURCE_ONLY':
      return <span className="verification-pill v-primary">PRIMARY SOURCE</span>;
    case 'MULTI_SOURCE_REPORTED':
      return <span className="verification-pill v-multi">MULTI-SOURCE</span>;
    case 'REPORTED':
      return <span className="verification-pill v-reported">REPORTED</span>;
    default:
      return <span className="verification-pill v-unverified">UNVERIFIED</span>;
  }
}

export function getScoreClass(score) {
  if (score >= 90) return 'score-high';
  if (score >= 70) return 'score-medium';
  return 'score-normal';
}

export default function EventCard({ event, isBreaking }) {
  const primaryArticle = event.eventArticles?.find(ea => ea.isPrimary)?.article || event.eventArticles?.[0]?.article;
  const sourceName = primaryArticle?.source?.name || 'Verified Source';
  const sourceUrl = primaryArticle?.url || '#';
  const timeAgo = formatTimeAgo(event.firstSeenAt);

  return (
    <div className={`card ${isBreaking ? 'breaking' : ''}`}>
      <div>
        <div className="card-top">
          <span className="category-tag">{event.category || 'GENERAL'}</span>
          <span className={`importance-score ${getScoreClass(event.importanceScore)}`}>
            {event.importanceScore}/100
          </span>
        </div>

        <h3 className="card-title-text">{event.canonicalTitle}</h3>

        <p className="card-summary">{event.summary}</p>

        {event.whyItMatters && (
          <div className="why-box">
            <span className="why-label">Why it matters:</span>
            {event.whyItMatters}
          </div>
        )}
      </div>

      <div className="card-bottom">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getVerificationBadge(event.verificationStatus)}
          <span>• {sourceName}</span>
        </div>

        <div>
          <span>{timeAgo}</span>
          {' | '}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="source-link">
            Read source →
          </a>
        </div>
      </div>
    </div>
  );
}
