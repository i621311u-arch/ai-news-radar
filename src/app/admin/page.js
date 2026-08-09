'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState('');

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      console.error('Error fetching health status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleManualFetch = async () => {
    setActionStatus('Running manual RSS ingestion & clustering pipeline...');
    try {
      const res = await fetch('/api/admin/fetch', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionStatus('✅ Ingestion pipeline completed successfully!');
        fetchHealth();
      } else {
        setActionStatus(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setActionStatus(`❌ Failed: ${err.message}`);
    }
  };

  const handleTestDigest = async () => {
    setActionStatus('Generating and sending test daily email digest...');
    try {
      const res = await fetch('/api/admin/digest', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionStatus('✅ Daily digest sent successfully!');
        fetchHealth();
      } else {
        setActionStatus(`⚠️ Digest result: ${data.result?.error || data.error || 'Check SMTP config'}`);
      }
    } catch (err) {
      setActionStatus(`❌ Failed: ${err.message}`);
    }
  };

  if (loading || !healthData) {
    return (
      <div className="radar-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div>⚙️ Loading system health metrics...</div>
      </div>
    );
  }

  const { stats, services, failedSources, recentLogs } = healthData;

  return (
    <div className="radar-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="app-title" style={{ fontSize: '24px' }}>SYSTEM HEALTH & ADMIN</h1>
          <div className="app-subtitle">MONITOR INGESTION PIPELINE & SERVICES</div>
        </div>

        <Link href="/" className="btn-secondary">
          ← Return to Dashboard
        </Link>
      </div>

      {/* Action Buttons & Status */}
      <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '28px' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>QUICK PIPELINE ACTIONS</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={handleManualFetch} style={{ background: 'var(--accent-indigo)', color: '#fff' }}>
            ⚡ Trigger Ingestion & Clustering Now
          </button>
          <button className="btn-secondary" onClick={handleTestDigest}>
            ✉️ Trigger Test 7 AM Email Digest
          </button>
        </div>
        {actionStatus && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
            {actionStatus}
          </div>
        )}
      </div>

      {/* Service Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="card">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>DATABASE</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-green)', marginTop: '4px' }}>
            SQLite Connected
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Articles: {stats.totalArticles} | Events: {stats.totalEvents}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>GEMINI AI</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: services.geminiAi.includes('configured') ? 'var(--accent-green)' : 'var(--accent-amber)', marginTop: '4px' }}>
            {services.geminiAi}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Model: gemini-2.5-flash
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SMTP EMAIL</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: services.smtpEmail.includes('configured') ? 'var(--accent-green)' : 'var(--accent-amber)', marginTop: '4px' }}>
            {services.smtpEmail}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Digest Schedule: 07:00 AM
          </div>
        </div>
      </div>

      {/* Failing Sources */}
      {failedSources && failedSources.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 className="section-title-text" style={{ color: 'var(--accent-red)', marginBottom: '12px' }}>
            ⚠️ FAILING SOURCES ({failedSources.length})
          </h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Source Name</th>
                <th>Last Error</th>
              </tr>
            </thead>
            <tbody>
              {failedSources.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td style={{ color: '#fca5a5', fontFamily: 'var(--font-mono)' }}>{s.lastError}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Ingestion Logs */}
      <div>
        <h2 className="section-title-text" style={{ marginBottom: '12px' }}>RECENT INGESTION LOGS</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Source</th>
              <th>Status</th>
              <th>Items Fetched</th>
              <th>Error Details</th>
            </tr>
          </thead>
          <tbody>
            {(recentLogs || []).map((log) => (
              <tr key={log.id}>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.source?.name}</td>
                <td>
                  <span style={{ 
                    color: log.status === 'SUCCESS' ? 'var(--accent-green)' : 'var(--accent-red)',
                    fontWeight: '700'
                  }}>
                    {log.status}
                  </span>
                </td>
                <td>{log.itemsFetched}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{log.errorMessage || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
