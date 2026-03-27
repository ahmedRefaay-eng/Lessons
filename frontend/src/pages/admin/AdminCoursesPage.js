import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Card, Alert, Spinner, Button, Input, Table } from '../../components/UI';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', subject: '', sort_order: '0' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get('/courses').then((r) => setCourses(r.data.courses));

  useEffect(() => { load().catch(() => setError('Failed to load courses.')).finally(() => setLoading(false)); }, []);

  const resetForm = () => { setForm({ title: '', description: '', subject: '', sort_order: '0' }); setEditCourse(null); setShowForm(false); };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openEdit = (course) => {
    setEditCourse(course);
    setForm({ title: course.title, description: course.description || '', subject: course.subject || '', sort_order: String(course.sort_order || 0) });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      if (editCourse) {
        await api.put(`/courses/${editCourse.id}`, form);
        setSuccess('Course updated!');
      } else {
        await api.post('/courses', form);
        setSuccess('Course created!');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course and all its sessions?')) return;
    try {
      await api.delete(`/courses/${id}`);
      setSuccess('Course deleted.');
      load();
    } catch { setError('Failed to delete.'); }
  };

  const handleToggle = async (course) => {
    try {
      await api.put(`/courses/${course.id}`, { is_published: !course.is_published });
      load();
    } catch { setError('Failed to update.'); }
  };

  if (loading) return <Spinner />;

  const columns = [
    { key: 'sort_order', label: '#', render: (v) => <span style={{ color: '#6b7280', fontWeight: 600 }}>{v}</span> },
    { key: 'title', label: 'Course Title', render: (v, row) => <span style={{ fontWeight: 600, color: '#1e40af' }}>{v}</span> },
    { key: 'subject', label: 'Subject', render: (v) => v || '—' },
    { key: 'session_count', label: 'Sessions', render: (v) => <span style={{ fontWeight: 600 }}>{v || 0}</span> },
    { key: 'is_published', label: 'Status', render: (v) => <span style={{ color: v ? '#16a34a' : '#6b7280' }}>{v ? '✅ Published' : '❌ Draft'}</span> },
    {
      key: 'id', label: 'Actions',
      render: (id, row) => (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Link to={`/admin/sessions/${id}`} style={{ textDecoration: 'none' }}>
            <Button variant="outline" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>📋 Sessions</Button>
          </Link>
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
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#111827' }}>🗂️ Manage Courses</h1>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>{showForm ? 'Cancel' : '+ New Course'}</Button>
      </div>
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {showForm && (
        <Card>
          <h2 style={{ marginBottom: '16px' }}>{editCourse ? 'Edit Course' : 'Create Course'}</h2>
          <form onSubmit={handleSubmit}>
            <Input label="Course Title" name="title" value={form.title} onChange={handleChange} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="Subject (e.g. Math, Science)" name="subject" value={form.subject} onChange={handleChange} />
              <Input label="Order (sort position)" name="sort_order" type="number" min="0" value={form.sort_order} onChange={handleChange} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box', resize: 'vertical' }}
                placeholder="Course description..."
              />
            </div>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : (editCourse ? 'Update Course' : 'Create Course')}</Button>
          </form>
        </Card>
      )}

      <Card>
        <Table columns={columns} rows={courses} emptyMessage="No courses yet. Create your first course above." />
      </Card>
    </div>
  );
}
