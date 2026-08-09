'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import SummaryBanner from '@/components/SummaryBanner';
import FilterBar from '@/components/FilterBar';
import EventCard from '@/components/EventCard';
import CompactRadar from '@/components/CompactRadar';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastVisit, setLastVisit] = useState(null);

  // Read/update last visit timestamp from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ainewsradar_last_visit');
    if (saved) {
      setLastVisit(new Date(saved));
    }
    localStorage.setItem('ainewsradar_last_visit', new Date().toISOString());
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, summaryRes] = await Promise.all([
        fetch(`/api/events?category=${category}&q=${encodeURIComponent(searchQuery)}`),
        fetch('/api/summary')
      ]);

      const eventsData = await eventsRes.json();
      const summaryData = await summaryRes.json();

      if (eventsData.success) {
        setEvents(eventsData.events || []);
      }
      if (summaryData.success) {
        setSummary(summaryData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category, searchQuery]);

  const handleManualSync = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/admin/fetch', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Error syncing feeds:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Categorized event subsets
  const breakingEvents = events.filter(e => e.priority === 'CRITICAL' || e.importanceScore >= 95);
  
  const sinceLastVisitEvents = lastVisit 
    ? events.filter(e => new Date(e.lastUpdatedAt) > lastVisit)
    : [];

  const researchEvents = events.filter(e => e.category === 'Research');
  const openSourceEvents = events.filter(e => e.category === 'Open Source');

  const topStories = category === 'Breaking' 
    ? breakingEvents 
    : (category === 'Top' ? events.filter(e => e.priority === 'CRITICAL' || e.priority === 'HIGH') : events);

  return (
    <div className="radar-container">
      <Header onRefresh={handleManualSync} refreshing={refreshing} />

      <SummaryBanner summaryData={summary} />

      <FilterBar
        selectedCategory={category}
        onSelectCategory={setCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div>📡 Scanning AI sources and analyzing clusters...</div>
        </div>
      ) : (
        <>
          {/* Breaking Section */}
          {breakingEvents.length > 0 && category === 'All' && !searchQuery && (
            <div style={{ marginBottom: '36px' }}>
              <div className="section-header">
                <h2 className="section-title-text" style={{ color: 'var(--accent-red)' }}>🚨 BREAKING INTELLIGENCE</h2>
                <span className="section-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>
                  IMMEDIATE ATTENTION
                </span>
              </div>
              <div className="cards-grid">
                {breakingEvents.slice(0, 3).map((event) => (
                  <EventCard key={event.id} event={event} isBreaking={true} />
                ))}
              </div>
            </div>
          )}

          {/* Since Last Visit Section */}
          {sinceLastVisitEvents.length > 0 && category === 'All' && !searchQuery && (
            <div style={{ marginBottom: '36px' }}>
              <div className="section-header">
                <h2 className="section-title-text">✨ SINCE YOU LAST VISITED</h2>
                <span className="section-badge">{sinceLastVisitEvents.length} NEW</span>
              </div>
              <div className="cards-grid">
                {sinceLastVisitEvents.slice(0, 3).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Main Top Stories Section */}
          <div style={{ marginBottom: '36px' }}>
            <div className="section-header">
              <h2 className="section-title-text">
                {category === 'All' ? 'TOP STORIES' : `${category.toUpperCase()} DEVELOPMENTS`}
              </h2>
              <span className="section-badge">{topStories.length} EVENTS</span>
            </div>

            {topStories.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                No developments match your current filter or query.
              </div>
            ) : (
              <div className="cards-grid">
                {topStories.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>

          {/* Research Radar Section */}
          {category === 'All' && !searchQuery && (
            <CompactRadar title="RESEARCH RADAR" events={researchEvents} />
          )}

          {/* Open Source Radar Section */}
          {category === 'All' && !searchQuery && (
            <CompactRadar title="OPEN SOURCE RADAR" events={openSourceEvents} />
          )}
        </>
      )}
    </div>
  );
}
