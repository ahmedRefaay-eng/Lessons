import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Alert, Spinner, Button, Input, Table } from '../../components/UI';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get('/admin/users').then((r) => setUsers(r.data.users));

  useEffect(() => { load().catch(() => setError('Failed to load users.')).finally(() => setLoading(false)); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await api.post('/admin/users', form);
      setSuccess('Admin account created successfully.');
      setShowForm(false);
      setForm({ email: '', password: '', first_name: '', last_name: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (user) => {
    try {
      await api.patch(`/admin/users/${user.id}/toggle`);
      setSuccess(`User ${user.is_active ? 'deactivated' : 'activated'}.`);
      load();
    } catch { setError('Failed to update user.'); }
  };

  const handleRoleChange = async (user) => {
    const newRole = user.role === 'admin' ? 'student' : 'admin';
    const confirmMsg = `${newRole === 'admin' ? 'Promote' : 'Demote'} ${user.email} to ${newRole}?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: newRole });
      setSuccess(`User role changed to ${newRole}.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change role.');
    }
  };

  if (loading) return <Spinner />;

  const columns = [
    { key: 'student_id', label: 'Student ID', render: (v) => <span style={{ fontFamily: 'monospace', color: '#1e40af' }}>{v}</span> },
    { key: 'email', label: 'Email' },
    { key: 'first_name', label: 'Name', render: (v, row) => `${v || ''} ${row.last_name || ''}`.trim() || '—' },
    { key: 'role', label: 'Role', render: (v) => <span style={{ textTransform: 'capitalize', fontWeight: 600, color: v === 'admin' ? '#7c3aed' : '#2563eb' }}>{v}</span> },
    {
      key: 'is_active', label: 'Status',
      render: (v) => <span style={{ color: v ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{v ? '✅ Active' : '❌ Inactive'}</span>,
    },
    { key: 'created_at', label: 'Registered', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    {
      key: 'id', label: 'Actions',
      render: (id, row) => (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Button
            variant={row.is_active ? 'danger' : 'success'}
            onClick={() => handleToggle(row)}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            {row.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant={row.role === 'admin' ? 'secondary' : 'outline'}
            onClick={() => handleRoleChange(row)}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            {row.role === 'admin' ? '↓ Demote' : '↑ Promote'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#111827' }}>👥 Manage Users</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Create Admin'}</Button>
      </div>
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {showForm && (
        <Card>
          <h2 style={{ marginBottom: '16px' }}>Create Admin Account</h2>
          <form onSubmit={handleCreateAdmin}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="First Name" name="first_name" value={form.first_name} onChange={handleChange} />
              <Input label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} />
            </div>
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
            <Input label="Password (min 8 chars, uppercase, lowercase, number)" name="password" type="password" value={form.password} onChange={handleChange} required />
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Admin'}</Button>
          </form>
        </Card>
      )}

      <Card>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>{users.length} user(s) registered</p>
        <Table columns={columns} rows={users} emptyMessage="No users found." />
      </Card>
    </div>
  );
}
