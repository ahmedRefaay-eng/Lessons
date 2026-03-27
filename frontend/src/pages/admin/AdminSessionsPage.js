import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Card, Alert, Spinner, Button, Input, Table } from '../../components/UI';

export default function AdminSessionsPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [form, setForm] = useState({ title: '', video_url: '', notes: '', sort_order: '0' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    api.get(`/sessions/course/${courseId}`).then((r) => {
      setCourse(r.data.course);
      setSessions(r.data.sessions);
    });

  useEffect(() => { load().catch(() => setError('Failed to load sessions.')).finally(() => setLoading(false)); }, [courseId]);

  const resetForm = () => { setForm({ title: '', video_url: '', notes: '', sort_order: '0' }); setFile(null); setEditSession(null); setShowForm(false); };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openEdit = (session) => {
    setEditSession(session);
    setForm({ title: session.title, video_url: session.video_url || '', notes: session.notes || '', sort_order: String(session.sort_order || 0) });
    setFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('sort_order', form.sort_order);
      if (form.video_url) formData.append('video_url', form.video_url);
      if (form.notes) formData.append('notes', form.notes);
      if (file) formData.append('file', file);

      if (editSession) {
        await api.put(`/sessions/${editSession.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess('Session updated!');
      } else {
        formData.append('course_id', courseId);
        await api.post('/sessions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess('Session created!');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save session.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await api.delete(`/sessions/${id}`);
      setSuccess('Session deleted.');
      load();
    } catch { setError('Failed to delete.'); }
  };

  const handleToggle = async (session) => {
    try {
      await api.put(`/sessions/${session.id}`, { is_published: !session.is_published });
      load();
    } catch { setError('Failed to update.'); }
  };

  if (loading) return <Spinner />;

  const columns = [
    { key: 'sort_order', label: '#', render: (v) => <span style={{ fontWeight: 700, color: '#7c3aed' }}>{v}</span> },
    { key: 'title', label: 'Session Title', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'video_url', label: 'Video', render: (v) => v ? <a href={v} target="_blank" rel="noreferrer" style={{ color: '#dc2626', fontWeight: 600 }}>▶ Watch</a> : '—' },
    { key: 'file_name', label: 'Notes File', render: (v) => v || '—' },
    { key: 'notes', label: 'Notes', render: (v) => v ? v.substring(0, 60) + (v.length > 60 ? '…' : '') : '—' },
    { key: 'is_published', label: 'Status', render: (v) => <span style={{ color: v ? '#16a34a' : '#6b7280' }}>{v ? '✅' : '❌'}</span> },
    {
      key: 'id', label: 'Actions',
      render: (id, row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button variant="secondary" onClick={() => openEdit(row)} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Edit</Button>
          <Button variant="outline" onClick={() => handleToggle(row)} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
            {row.is_published ? 'Hide' : 'Show'}
          </Button>
          <Button variant="danger" onClick={() => handleDelete(id)} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '8px' }}>
        <Link to="/admin/courses" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Courses</Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#111827' }}>📋 Sessions: {course?.title}</h1>
          {course?.subject && <p style={{ color: '#6b7280', margin: 0 }}>{course.subject}</p>}
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>{showForm ? 'Cancel' : '+ New Session'}</Button>
      </div>
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {showForm && (
        <Card>
          <h2 style={{ marginBottom: '16px' }}>{editSession ? 'Edit Session' : 'Create Session'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '16px' }}>
              <Input label="Session Title" name="title" value={form.title} onChange={handleChange} required />
              <Input label="Order" name="sort_order" type="number" min="0" value={form.sort_order} onChange={handleChange} />
            </div>
            <Input label="Video URL (YouTube, Vimeo, etc.)" name="video_url" type="url" value={form.video_url} onChange={handleChange} placeholder="https://youtube.com/..." />
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={5}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box', resize: 'vertical' }}
                placeholder="Session notes..."
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                Attach File (PDF, Word, PPT, Image — max 10MB)
              </label>
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt" onChange={(e) => setFile(e.target.files[0])} />
              {editSession?.file_name && !file && (
                <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '4px' }}>Current: {editSession.file_name}</p>
              )}
            </div>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : (editSession ? 'Update Session' : 'Create Session')}</Button>
          </form>
        </Card>
      )}

      <Card>
        <Table columns={columns} rows={sessions} emptyMessage="No sessions yet. Add the first session above." />
      </Card>
    </div>
  );
}
