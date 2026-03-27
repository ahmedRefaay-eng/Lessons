import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Alert, Spinner, Button, Input, Table } from '../../components/UI';

export default function AdminExamsPage() {
  const [exams, setExams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', duration: '', is_active: false });
  const [assignExam, setAssignExam] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const load = async () => {
    const [examsRes, usersRes] = await Promise.all([api.get('/exams'), api.get('/admin/users?role=student')]);
    setExams(examsRes.data.exams);
    setUsers(usersRes.data.users);
  };

  useEffect(() => { load().catch(() => setError('Failed to load.')).finally(() => setLoading(false)); }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/exams', form);
      setSuccess('Exam created!');
      setShowForm(false);
      setForm({ title: '', description: '', date: '', duration: '', is_active: false });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam.');
    }
  };

  const handleToggle = async (exam) => {
    try {
      await api.put(`/exams/${exam.id}`, { is_active: !exam.is_active });
      setSuccess(`Exam ${!exam.is_active ? 'activated' : 'deactivated'}`);
      load();
    } catch { setError('Failed to update.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      setSuccess('Deleted.');
      load();
    } catch { setError('Failed to delete.'); }
  };

  const handleAssign = async () => {
    if (selectedUsers.length === 0) { setError('Select at least one student.'); return; }
    try {
      await api.post(`/exams/${assignExam.id}/assign`, { user_ids: selectedUsers });
      setSuccess(`Assigned ${selectedUsers.length} student(s).`);
      setAssignExam(null);
      setSelectedUsers([]);
    } catch (err) { setError(err.response?.data?.message || 'Failed to assign.'); }
  };

  if (loading) return <Spinner />;

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'date', label: 'Date', render: (v) => v ? new Date(v).toLocaleString() : '-' },
    { key: 'duration', label: 'Duration', render: (v) => `${v} min` },
    { key: 'is_active', label: 'Status', render: (v) => <span style={{ color: v ? '#16a34a' : '#6b7280', fontWeight: 600 }}>{v ? '🟢 Active' : '⚫ Inactive'}</span> },
    {
      key: 'id', label: 'Actions',
      render: (id, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant={row.is_active ? 'secondary' : 'success'} onClick={() => handleToggle(row)} style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
            {row.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="outline" onClick={() => { setAssignExam(row); setSelectedUsers([]); }} style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
            Assign
          </Button>
          <Button variant="danger" onClick={() => handleDelete(id)} style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#111827' }}>📝 Manage Exams</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New Exam'}</Button>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {showForm && (
        <Card>
          <h2 style={{ marginBottom: '16px' }}>Create New Exam</h2>
          <form onSubmit={handleCreate}>
            <Input label="Title" name="title" value={form.title} onChange={handleChange} required />
            <Input label="Description (optional)" name="description" value={form.description} onChange={handleChange} />
            <Input label="Date & Time" name="date" type="datetime-local" value={form.date} onChange={handleChange} required />
            <Input label="Duration (minutes)" name="duration" type="number" min="1" value={form.duration} onChange={handleChange} required />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
              <span>Active (students can access)</span>
            </label>
            <Button type="submit">Create Exam</Button>
          </form>
        </Card>
      )}

      <Card>
        <Table columns={columns} rows={exams} emptyMessage="No exams yet." />
      </Card>

      {/* Assign students modal */}
      {assignExam && (
        <div style={overlayStyle}>
          <Card style={{ maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '16px' }}>Assign Students to "{assignExam.title}"</h2>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>Select students to assign to this exam:</p>
            {users.map((u) => (
              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(u.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedUsers([...selectedUsers, u.id]);
                    else setSelectedUsers(selectedUsers.filter((id) => id !== u.id));
                  }}
                />
                <span>{u.first_name || ''} {u.last_name || ''} <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>({u.email})</span></span>
                <span style={{ marginLeft: 'auto', fontFamily: 'monospace', color: '#1e40af', fontSize: '0.8rem' }}>{u.student_id}</span>
              </label>
            ))}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Button onClick={handleAssign} style={{ flex: 1 }}>Assign Selected ({selectedUsers.length})</Button>
              <Button variant="secondary" onClick={() => setAssignExam(null)} style={{ flex: 1 }}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' };
