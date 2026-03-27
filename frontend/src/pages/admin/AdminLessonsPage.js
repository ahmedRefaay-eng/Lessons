import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Alert, Spinner, Button, Input, Table } from '../../components/UI';

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get('/lessons').then((r) => setLessons(r.data.lessons)).catch(() => setError('Failed to load.'));

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      if (content) formData.append('content', content);
      if (file) formData.append('file', file);
      await api.post('/lessons', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Lesson created!');
      setShowForm(false);
      setTitle(''); setContent(''); setFile(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create lesson.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/lessons/${id}`);
      setSuccess('Deleted.');
      load();
    } catch { setError('Failed to delete.'); }
  };

  const handleToggle = async (lesson) => {
    try {
      await api.put(`/lessons/${lesson.id}`, { is_published: !lesson.is_published });
      load();
    } catch { setError('Failed to update.'); }
  };

  if (loading) return <Spinner />;

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'file_name', label: 'File', render: (v) => v || '—' },
    { key: 'is_published', label: 'Published', render: (v) => <span style={{ color: v ? '#16a34a' : '#6b7280' }}>{v ? '✅ Yes' : '❌ No'}</span> },
    { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    {
      key: 'id', label: 'Actions',
      render: (id, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" onClick={() => handleToggle(row)} style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
            {row.is_published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="danger" onClick={() => handleDelete(id)} style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#111827' }}>📚 Manage Lessons</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New Lesson'}</Button>
      </div>
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {showForm && (
        <Card>
          <h2 style={{ marginBottom: '16px' }}>Create Lesson</h2>
          <form onSubmit={handleSubmit}>
            <Input label="Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box', resize: 'vertical' }}
                placeholder="Lesson content..."
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                Attach File (PDF, Word, PPT, Image — max 10MB)
              </label>
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt" onChange={(e) => setFile(e.target.files[0])} />
            </div>
            <Button type="submit" disabled={submitting}>{submitting ? 'Uploading...' : 'Create Lesson'}</Button>
          </form>
        </Card>
      )}

      <Card>
        <Table columns={columns} rows={lessons} emptyMessage="No lessons yet." />
      </Card>
    </div>
  );
}
