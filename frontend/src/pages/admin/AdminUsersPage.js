import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Alert, Spinner, Button, Table } from '../../components/UI';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => api.get('/admin/users').then((r) => setUsers(r.data.users));

  useEffect(() => { load().catch(() => setError('Failed to load users.')).finally(() => setLoading(false)); }, []);

  const handleToggle = async (user) => {
    try {
      await api.patch(`/admin/users/${user.id}/toggle`);
      setSuccess(`User ${user.is_active ? 'deactivated' : 'activated'}.`);
      load();
    } catch { setError('Failed to update user.'); }
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
        <Button
          variant={row.is_active ? 'danger' : 'success'}
          onClick={() => handleToggle(row)}
          style={{ padding: '5px 12px', fontSize: '0.8rem' }}
        >
          {row.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', color: '#111827', marginBottom: '24px' }}>👥 Manage Users</h1>
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}
      <Card>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>{users.length} user(s) registered</p>
        <Table columns={columns} rows={users} emptyMessage="No users found." />
      </Card>
    </div>
  );
}
