'use client';

const CATEGORIES = [
  'All',
  'Breaking',
  'Top',
  'Models',
  'Research',
  'Open Source',
  'Agents',
  'Products',
  'Hardware',
  'Safety',
  'Policy'
];

export default function FilterBar({ selectedCategory, onSelectCategory, searchQuery, onSearchChange }) {
  return (
    <div className="filter-bar">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search GPT, Claude, Gemini, reasoning, robotics, open source..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filter-chips">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
