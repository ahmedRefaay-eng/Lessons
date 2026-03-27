import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Alert, Spinner } from '../../components/UI';

export default function LessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/lessons')
      .then((r) => setLessons(r.data.lessons))
      .catch(() => setError('Failed to load lessons.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', color: '#111827', marginBottom: '24px' }}>📚 Lessons</h1>
      {error && <Alert type="error">{error}</Alert>}

      {selected ? (
        <Card>
          <button onClick={() => setSelected(null)} style={backBtn}>← Back to lessons</button>
          <h2 style={{ fontSize: '1.5rem', color: '#111827', marginBottom: '16px' }}>{selected.title}</h2>
          {selected.content && (
            <div style={{ color: '#374151', lineHeight: 1.7, marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
              {selected.content}
            </div>
          )}
          {selected.file_url && (
            <a
              href={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${selected.file_url}`}
              target="_blank"
              rel="noreferrer"
              style={downloadLink}
            >
              📎 Download: {selected.file_name || 'Attachment'}
            </a>
          )}
          <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '16px' }}>
            Published {new Date(selected.created_at).toLocaleDateString()}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {lessons.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No lessons available yet.</p>
          ) : (
            lessons.map((lesson) => (
              <div
                key={lesson.id}
                style={lessonCard}
                onClick={() => setSelected(lesson)}
              >
                <h3 style={{ color: '#1e40af', marginBottom: '8px' }}>{lesson.title}</h3>
                {lesson.content && (
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '8px' }}>
                    {lesson.content.substring(0, 120)}{lesson.content.length > 120 ? '...' : ''}
                  </p>
                )}
                {lesson.file_url && (
                  <p style={{ color: '#0891b2', fontSize: '0.85rem' }}>📎 Has attachment</p>
                )}
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '8px' }}>
                  {new Date(lesson.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const lessonCard = {
  background: '#fff',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  cursor: 'pointer',
  borderLeft: '4px solid #2563eb',
  transition: 'box-shadow 0.2s',
};

const backBtn = {
  background: 'transparent',
  border: 'none',
  color: '#2563eb',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600,
  marginBottom: '16px',
  padding: 0,
};

const downloadLink = {
  display: 'inline-block',
  padding: '10px 20px',
  background: '#dbeafe',
  color: '#1e40af',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.9rem',
};
