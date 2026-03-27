import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { Card, Alert, Spinner, Button } from '../../components/UI';

const _apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_BASE = _apiUrl.endsWith('/api')
  ? _apiUrl.slice(0, -4)
  : _apiUrl.replace(/\/api\/.*$/, '');

export default function SessionsPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCourse, setActiveCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [markingComplete, setMarkingComplete] = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      const r = await api.get('/session-progress/me');
      const ids = new Set((r.data.progress || []).map((p) => p.session_id));
      setCompletedIds(ids);
    } catch {
      // Progress is non-critical – ignore errors
    }
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/session-progress/me').catch(() => ({ data: { progress: [] } })),
    ])
      .then(([coursesRes, progressRes]) => {
        setCourses(coursesRes.data.courses);
        const ids = new Set((progressRes.data.progress || []).map((p) => p.session_id));
        setCompletedIds(ids);
      })
      .catch(() => setError('Failed to load courses.'))
      .finally(() => setLoading(false));
  }, []);

  const openCourse = async (course) => {
    setActiveCourse(course);
    setActiveSession(null);
    setSessionsLoading(true);
    try {
      const r = await api.get(`/sessions/course/${course.id}`);
      setSessions(r.data.sessions);
    } catch {
      setError('Failed to load sessions.');
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleMarkComplete = async (sessionId) => {
    if (completedIds.has(sessionId)) return;
    setMarkingComplete(true);
    try {
      await api.post(`/session-progress/${sessionId}/complete`);
      setCompletedIds((prev) => new Set([...prev, sessionId]));
    } catch {
      // Silently ignore – progress is non-critical
    } finally {
      setMarkingComplete(false);
    }
  };

  if (loading) return <Spinner />;

  // Session detail view
  if (activeSession) {
    return (
      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <button onClick={() => setActiveSession(null)} style={backBtn}>← Back to sessions</button>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ background: '#7c3aed', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
              {activeSession.sort_order}
            </span>
            <h2 style={{ fontSize: '1.5rem', color: '#111827', margin: 0 }}>{activeSession.title}</h2>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '20px' }}>
            From: {activeCourse?.title}
          </p>

          {activeSession.video_url && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#111827', marginBottom: '12px' }}>🎬 Video</h3>
              <a
                href={activeSession.video_url}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#dc2626', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}
              >
                ▶ Watch Video
              </a>
            </div>
          )}

          {activeSession.notes && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#111827', marginBottom: '12px' }}>📝 Notes</h3>
              <div style={{ color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                {activeSession.notes}
              </div>
            </div>
          )}

          {activeSession.file_url && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#111827', marginBottom: '12px' }}>📎 Attachment</h3>
              <a
                href={`${API_BASE}${activeSession.file_url}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-block', padding: '10px 20px', background: '#dbeafe', color: '#1e40af', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}
              >
                📥 Download: {activeSession.file_name || 'Attachment'}
              </a>
            </div>
          )}

          {/* Mark Complete + Previous / Next navigation */}
          <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              {completedIds.has(activeSession.id) ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', fontWeight: 700 }}>
                  ✅ Session Completed
                </div>
              ) : (
                <Button
                  onClick={() => handleMarkComplete(activeSession.id)}
                  disabled={markingComplete}
                  variant="success"
                >
                  {markingComplete ? 'Saving...' : '✓ Mark as Complete'}
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {(() => {
                const idx = sessions.findIndex((s) => s.id === activeSession.id);
                const prev = sessions[idx - 1];
                const next = sessions[idx + 1];
                return (
                  <>
                    {prev ? (
                      <button onClick={() => setActiveSession(prev)} style={navBtn}>← {prev.title}</button>
                    ) : <span />}
                    {next ? (
                      <button onClick={() => setActiveSession(next)} style={{ ...navBtn, textAlign: 'right' }}>{next.title} →</button>
                    ) : <span />}
                  </>
                );
              })()}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Course sessions list
  if (activeCourse) {
    return (
      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <button onClick={() => setActiveCourse(null)} style={backBtn}>← Back to courses</button>
        <h1 style={{ fontSize: '1.8rem', color: '#111827', marginBottom: '4px' }}>{activeCourse.title}</h1>
        {activeCourse.subject && <p style={{ color: '#7c3aed', fontWeight: 600, marginBottom: '4px' }}>📚 {activeCourse.subject}</p>}
        {activeCourse.description && <p style={{ color: '#6b7280', marginBottom: '20px' }}>{activeCourse.description}</p>}

        {sessionsLoading ? <Spinner /> : sessions.length === 0 ? (
          <Card><p style={{ color: '#6b7280', textAlign: 'center' }}>No sessions available yet.</p></Card>
        ) : (
          <div>
            {/* Progress bar */}
            {(() => {
              const doneCount = sessions.filter((s) => completedIds.has(s.id)).length;
              const pct = Math.round((doneCount / sessions.length) * 100);
              return (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span>Progress</span>
                    <span>{doneCount} / {sessions.length} completed</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '999px', height: '8px' }}>
                    <div style={{ background: '#16a34a', borderRadius: '999px', height: '8px', width: `${pct}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })()}
            {sessions.map((session) => {
              const done = completedIds.has(session.id);
              return (
                <div
                  key={session.id}
                  onClick={() => setActiveSession(session)}
                  style={{ ...sessionRow, borderLeft: done ? '4px solid #16a34a' : '4px solid transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ background: done ? '#16a34a' : '#7c3aed', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                      {done ? '✓' : session.sort_order}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>{session.title}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.85rem', display: 'flex', gap: '12px', marginTop: '2px' }}>
                        {session.video_url && <span>🎬 Video</span>}
                        {session.notes && <span>📝 Notes</span>}
                        {session.file_url && <span>📎 Attachment</span>}
                      </div>
                    </div>
                  </div>
                  <span style={{ color: '#2563eb', fontSize: '1.2rem' }}>›</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Courses list
  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', color: '#111827', marginBottom: '8px' }}>📚 Courses & Sessions</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>Select a course to view its sessions in order.</p>
      {error && <Alert type="error">{error}</Alert>}

      {courses.length === 0 ? (
        <Card><p style={{ color: '#6b7280', textAlign: 'center' }}>No courses available yet.</p></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {courses.map((course) => (
            <div key={course.id} onClick={() => openCourse(course)} style={courseCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  {course.subject && <span style={{ color: '#7c3aed', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{course.subject}</span>}
                  <h3 style={{ color: '#1e40af', margin: '4px 0 8px', fontSize: '1.1rem' }}>{course.title}</h3>
                </div>
                <span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: '20px', padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
                  {course.session_count || 0} sessions
                </span>
              </div>
              {course.description && (
                <p style={{ color: '#6b7280', fontSize: '0.88rem', margin: 0 }}>
                  {course.description.substring(0, 100)}{course.description.length > 100 ? '...' : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const backBtn = { background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, marginBottom: '16px', padding: 0 };
const navBtn = { background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, maxWidth: '45%' };
const courseCard = { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer', borderLeft: '4px solid #7c3aed', transition: 'box-shadow 0.2s' };
const sessionRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '10px', cursor: 'pointer', border: '1px solid #e5e7eb' };
