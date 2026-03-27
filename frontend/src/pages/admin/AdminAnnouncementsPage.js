import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Alert, Spinner, Button, Input, Table } from '../../components/UI';

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get('/announcements').then((r) => setAnnouncements(r.data.announcements));

  useEffect(() => { load().catch(() => setError('Failed to load.')).finally(() => setLoading(false)); }, []);

  const resetForm = () => { setForm({ title: '', body: '' }); setEditItem(null); setShowForm(false); };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title, body: item.body });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      if (editItem) {
        await api.put(`/announcements/${editItem.id}`, form);
        setSuccess('Announcement updated!');
      } else {
        await api.post('/announcements', form);
        setSuccess('Announcement published!');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setSuccess('Deleted.');
      load();
    } catch { setError('Failed to delete.'); }
  };

  const handleToggle = async (item) => {
    try {
      await api.put(`/announcements/${item.id}`, { is_published: !item.is_published });
      load();
    } catch { setError('Failed to update.'); }
  };

  if (loading) return <Spinner />;

  const columns = [
    { key: 'title', label: 'Title', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'body', label: 'Preview', render: (v) => v.substring(0, 80) + (v.length > 80 ? '…' : '') },
    { key: 'is_published', label: 'Status', render: (v) => <span style={{ color: v ? '#16a34a' : '#6b7280' }}>{v ? '✅ Published' : '❌ Draft'}</span> },
    { key: 'created_at', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    {
      key: 'id', label: 'Actions',
      render: (id, row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button variant="secondary" onClick={() => openEdit(row)} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Edit</Button>
          <Button variant="outline" onClick={() => handleToggle(row)} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
            {row.is_published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="danger" onClick={() => handleDelete(id)} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#111827' }}>📢 Announcements</h1>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>{showForm ? 'Cancel' : '+ New Announcement'}</Button>
      </div>
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {showForm && (
        <Card>
          <h2 style={{ marginBottom: '16px' }}>{editItem ? 'Edit Announcement' : 'Create Announcement'}</h2>
          <form onSubmit={handleSubmit}>
            <Input label="Title" name="title" value={form.title} onChange={handleChange} required />
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>Message</label>
              <textarea
                name="body"
                value={form.body}
                onChange={handleChange}
                rows={6}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box', resize: 'vertical' }}
                placeholder="Announcement message..."
              />
            </div>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : (editItem ? 'Update' : 'Publish')}</Button>
          </form>
        </Card>
      )}

      <Card>
        <Table columns={columns} rows={announcements} emptyMessage="No announcements yet." />
      </Card>
    </div>
  );
}
