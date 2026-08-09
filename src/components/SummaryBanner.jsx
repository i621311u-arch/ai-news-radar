'use client';

export default function SummaryBanner({ summaryData }) {
  if (!summaryData) return null;

  const { overviewMessage, bullets } = summaryData;

  return (
    <div className="summary-banner">
      <div className="summary-title">
        <span>⚡</span> AI IN ONE MINUTE
      </div>
      
      <p className="summary-message">{overviewMessage}</p>

      {bullets && bullets.length > 0 && (
        <ul className="summary-bullets">
          {bullets.map((bullet) => (
            <li key={bullet.id} className="summary-bullet-item">
              <span className="bullet-dot">•</span>
              <div>
                <strong>{bullet.title}</strong>: {bullet.whyItMatters || bullet.summary}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
