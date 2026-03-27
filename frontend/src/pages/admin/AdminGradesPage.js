import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Alert, Spinner, Button, Input, Table } from '../../components/UI';

export default function AdminGradesPage() {
  const [grades, setGrades] = useState([]);
  const [exams, setExams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ user_id: '', exam_id: '', grade: '', feedback: '' });

  const load = async () => {
    const [gradesRes, examsRes, usersRes] = await Promise.all([
      api.get('/grades'),
      api.get('/exams'),
      api.get('/admin/users?role=student'),
    ]);
    setGrades(gradesRes.data.grades);
    setExams(examsRes.data.exams);
    setUsers(usersRes.data.users);
  };

  useEffect(() => { load().catch(() => setError('Failed to load.')).finally(() => setLoading(false)); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/grades', { ...form, user_id: parseInt(form.user_id), exam_id: parseInt(form.exam_id), grade: parseFloat(form.grade) });
      setSuccess('Grade saved!');
      setShowForm(false);
      setForm({ user_id: '', exam_id: '', grade: '', feedback: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save grade.');
    }
  };

  if (loading) return <Spinner />;

  const columns = [
    { key: 'student_id', label: 'Student ID', render: (v) => <span style={{ fontFamily: 'monospace', color: '#1e40af' }}>{v}</span> },
    { key: 'email', label: 'Email' },
    { key: 'exam_title', label: 'Exam' },
    {
      key: 'grade', label: 'Grade',
      render: (v) => <span style={{ fontWeight: 700, color: parseFloat(v) >= 50 ? '#16a34a' : '#dc2626' }}>{parseFloat(v).toFixed(1)}%</span>,
    },
    { key: 'feedback', label: 'Feedback' },
    { key: 'graded_at', label: 'Graded At', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#111827' }}>📊 Grades</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Assign Grade'}</Button>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {showForm && (
        <Card>
          <h2 style={{ marginBottom: '16px' }}>Assign / Update Grade</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Student</label>
              <select style={selectStyle} name="user_id" value={form.user_id} onChange={handleChange} required>
                <option value="">Select student</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.first_name || ''} {u.last_name || ''} ({u.email}) — {u.student_id}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Exam</label>
              <select style={selectStyle} name="exam_id" value={form.exam_id} onChange={handleChange} required>
                <option value="">Select exam</option>
                {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
            <Input label="Grade (0-100)" name="grade" type="number" min="0" max="100" step="0.01" value={form.grade} onChange={handleChange} required />
            <Input label="Feedback (optional)" name="feedback" value={form.feedback} onChange={handleChange} />
            <Button type="submit">Save Grade</Button>
          </form>
        </Card>
      )}

      <Card>
        <Table columns={columns} rows={grades} emptyMessage="No grades yet." />
      </Card>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '0.9rem' };
const selectStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.95rem' };
